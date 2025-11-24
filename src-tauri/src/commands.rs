use crate::credentials::CredentialManager;
use crate::error::{AppError, Result};
use crate::models::{CollectionList, DocumentPage, FirestoreDocument, ServiceAccountSummary};
use crate::state::AppState;
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use chrono::{DateTime, Utc};
use firestore::errors::FirestoreError;
use firestore::{
    FirestoreCreateSupport, FirestoreDb, FirestoreDbOptions, FirestoreGetByIdSupport,
    FirestoreListCollectionIdsParams, FirestoreListDocParams, FirestoreListingSupport,
    FirestoreUpdateSupport,
};
use gcloud_sdk::google::firestore::v1::value::ValueType;
use gcloud_sdk::google::firestore::v1::{ArrayValue, Document, MapValue, Value};
use gcloud_sdk::google::r#type::LatLng;
use prost_types::Timestamp;
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use tauri::State;

type CmdResult<T> = std::result::Result<T, String>;

#[tauri::command]
pub async fn import_service_account(
    credential_manager: State<'_, CredentialManager>,
    file_path: String,
) -> CmdResult<ServiceAccountSummary> {
    let manager = credential_manager.inner().clone();
    run_blocking(move || manager.save_from_path(file_path)).await
}

#[tauri::command]
pub async fn list_service_accounts(
    credential_manager: State<'_, CredentialManager>,
) -> CmdResult<Vec<ServiceAccountSummary>> {
    let manager = credential_manager.inner().clone();
    run_blocking(move || manager.list()).await
}

#[tauri::command]
pub async fn set_active_account(
    credential_manager: State<'_, CredentialManager>,
    app_state: State<'_, AppState>,
    account_id: String,
) -> CmdResult<ServiceAccountSummary> {
    let manager = credential_manager.inner().clone();
    let lookup_id = account_id.clone();
    let (credential_path, metadata) = run_blocking(move || {
        let path = manager.credential_path(&lookup_id)?;
        let metadata = manager.load_metadata(&lookup_id)?;
        Ok((path, metadata))
    })
    .await?;

    let summary = ServiceAccountSummary {
        id: account_id.clone(),
        project_id: metadata.project_id.clone(),
        client_email: metadata.client_email.clone(),
    };

    let db = FirestoreDb::with_options_service_account_key_file(
        FirestoreDbOptions::new(metadata.project_id),
        credential_path,
    )
    .await
    .map_err(|err| err.to_string())?;

    app_state.set_db(db).await;
    Ok(summary)
}

#[tauri::command]
pub async fn list_collections(
    app_state: State<'_, AppState>,
    parent_path: Option<String>,
    page_size: Option<usize>,
    page_token: Option<String>,
) -> CmdResult<CollectionList> {
    let db = app_state.db().await.map_err(|err| err.to_command_err())?;
    let params = FirestoreListCollectionIdsParams {
        parent: normalize_parent_path(&db, parent_path).map_err(|err| err.to_command_err())?,
        page_size: page_size.unwrap_or(100),
        page_token,
    };
    let result = db
        .list_collection_ids(params)
        .await
        .map_err(|err| err.to_string())?;
    Ok(CollectionList {
        collection_ids: result.collection_ids,
        next_page_token: result.page_token,
    })
}

#[tauri::command]
pub async fn list_documents(
    app_state: State<'_, AppState>,
    collection_path: String,
    page_size: Option<usize>,
    page_token: Option<String>,
) -> CmdResult<DocumentPage> {
    let db = app_state.db().await.map_err(|err| err.to_command_err())?;
    let (collection_id, parent) =
        parse_collection_path(&db, &collection_path).map_err(|err| err.to_command_err())?;
    let params = FirestoreListDocParams {
        collection_id,
        parent,
        page_size: page_size.unwrap_or(50),
        page_token,
        order_by: None,
        return_only_fields: None,
    };
    let result = db.list_doc(params).await.map_err(|err| err.to_string())?;
    let documents = result
        .documents
        .into_iter()
        .map(|doc| document_to_model(doc, &db))
        .collect::<Result<Vec<_>>>()
        .map_err(|err| err.to_command_err())?;
    Ok(DocumentPage {
        documents,
        next_page_token: result.page_token,
    })
}

#[tauri::command]
pub async fn get_document(
    app_state: State<'_, AppState>,
    document_path: String,
) -> CmdResult<FirestoreDocument> {
    let db = app_state.db().await.map_err(|err| err.to_command_err())?;
    let (collection_id, document_id, parent) =
        parse_document_path(&db, &document_path).map_err(|err| err.to_command_err())?;
    let document = db
        .get_doc_at(&parent, &collection_id, document_id, None)
        .await
        .map_err(|err| err.to_string())?;
    document_to_model(document, &db).map_err(|err| err.to_command_err())
}

#[tauri::command]
pub async fn save_document(
    app_state: State<'_, AppState>,
    document_path: String,
    data: JsonValue,
) -> CmdResult<FirestoreDocument> {
    let db = app_state.db().await.map_err(|err| err.to_command_err())?;
    let (collection_id, document_id, parent) =
        parse_document_path(&db, &document_path).map_err(|err| err.to_command_err())?;
    let full_name = format!("{}/{}/{}", parent, collection_id, document_id);
    let mut serialized = json_to_document(&db, &data, Some(full_name.clone()))
        .map_err(|err| err.to_command_err())?;

    let exists = db
        .get_doc_at(&parent, &collection_id, &document_id, None)
        .await;

    let updated = match exists {
        Ok(_) => {
            db.update_doc(&collection_id, serialized, None, None, None)
                .await
        }
        Err(FirestoreError::DataNotFoundError(_)) => {
            serialized.name.clear();
            db.create_doc_at(
                &parent,
                &collection_id,
                Some(document_id.clone()),
                serialized,
                None,
            )
            .await
        }
        Err(err) => Err(err),
    }
    .map_err(|err| err.to_string())?;

    document_to_model(updated, &db).map_err(|err| err.to_command_err())
}

#[tauri::command]
pub async fn duplicate_document(
    app_state: State<'_, AppState>,
    source_path: String,
    target_path: String,
    overwrite: Option<bool>,
) -> CmdResult<FirestoreDocument> {
    let overwrite = overwrite.unwrap_or(false);
    let db = app_state.db().await.map_err(|err| err.to_command_err())?;
    let (source_collection, source_id, source_parent) =
        parse_document_path(&db, &source_path).map_err(|err| err.to_command_err())?;
    let (target_collection, target_id, target_parent) =
        parse_document_path(&db, &target_path).map_err(|err| err.to_command_err())?;

    let mut source = db
        .get_doc_at(&source_parent, &source_collection, source_id, None)
        .await
        .map_err(|err| err.to_string())?;

    if !overwrite {
        let exists = db
            .get_doc_at(&target_parent, &target_collection, &target_id, None)
            .await
            .ok();
        if exists.is_some() {
            return Err(format!(
                "Document {} already exists under {}",
                target_id, target_collection
            ));
        }
    }

    if overwrite {
        source.name = format!("{}/{}/{}", target_parent, target_collection, target_id);
        let updated = db
            .update_doc(&target_collection, source, None, None, None)
            .await
            .map_err(|err| err.to_string())?;
        return document_to_model(updated, &db).map_err(|err| err.to_command_err());
    }

    source.name.clear();
    let inserted = db
        .create_doc_at(
            &target_parent,
            &target_collection,
            Some(target_id.clone()),
            source,
            None,
        )
        .await
        .map_err(|err| err.to_string())?;

    document_to_model(inserted, &db).map_err(|err| err.to_command_err())
}

#[tauri::command]
pub async fn duplicate_collection(
    app_state: State<'_, AppState>,
    source_collection_path: String,
    target_collection_path: String,
    overwrite: Option<bool>,
) -> CmdResult<u32> {
    let overwrite = overwrite.unwrap_or(false);
    let db = app_state.db().await.map_err(|err| err.to_command_err())?;
    let (source_collection, source_parent) =
        parse_collection_path(&db, &source_collection_path).map_err(|err| err.to_command_err())?;
    let (target_collection, target_parent) =
        parse_collection_path(&db, &target_collection_path).map_err(|err| err.to_command_err())?;
    let target_parent_path = parent_or_root(&db, &target_parent);

    let mut copied = 0u32;
    let mut page_token: Option<String> = None;

    loop {
        let params = FirestoreListDocParams {
            collection_id: source_collection.clone(),
            parent: source_parent.clone(),
            page_size: 200,
            page_token: page_token.clone(),
            order_by: None,
            return_only_fields: None,
        };
        let page = db.list_doc(params).await.map_err(|err| err.to_string())?;
        let next_token = page.page_token.clone();

        for mut doc in page.documents.into_iter() {
            let doc_id = doc
                .name
                .rsplit('/')
                .next()
                .ok_or_else(|| "Invalid Firestore document name".to_string())?
                .to_string();

            if !overwrite {
                let maybe_existing = db
                    .get_doc_at(&target_parent_path, &target_collection, &doc_id, None)
                    .await;
                if maybe_existing.is_ok() {
                    return Err(format!(
                        "Document {} already exists inside {}",
                        doc_id, target_collection
                    ));
                }
            }

            if overwrite {
                doc.name = format!("{}/{}/{}", target_parent_path, target_collection, doc_id);
                db.update_doc(&target_collection, doc, None, None, None)
                    .await
                    .map_err(|err| err.to_string())?;
            } else {
                doc.name.clear();
                db.create_doc_at(
                    &target_parent_path,
                    &target_collection,
                    Some(doc_id),
                    doc,
                    None,
                )
                .await
                .map_err(|err| err.to_string())?;
            }

            copied += 1;
        }

        if next_token.is_none() {
            break;
        }
        page_token = next_token;
    }

    Ok(copied)
}

async fn run_blocking<F, T>(func: F) -> CmdResult<T>
where
    F: FnOnce() -> Result<T> + Send + 'static,
    T: Send + 'static,
{
    let join_result = tauri::async_runtime::spawn_blocking(func)
        .await
        .map_err(|err| err.to_string())?;
    join_result.map_err(|err| err.to_command_err())
}

fn normalize_parent_path(db: &FirestoreDb, parent: Option<String>) -> Result<Option<String>> {
    if let Some(value) = parent {
        let trimmed = value.trim_matches('/');
        if trimmed.is_empty() {
            return Ok(None);
        }
        Ok(Some(format!("{}/{}", db.get_documents_path(), trimmed)))
    } else {
        Ok(None)
    }
}

fn parse_collection_path(db: &FirestoreDb, path: &str) -> Result<(String, Option<String>)> {
    let segments = split_segments(path);
    if segments.is_empty() {
        return Err(AppError::InvalidPath(
            "collection path cannot be empty".into(),
        ));
    }
    if segments.len() % 2 == 0 {
        return Err(AppError::InvalidPath(path.to_string()));
    }
    let collection_id = segments.last().unwrap().to_string();
    let parent = if segments.len() == 1 {
        None
    } else {
        Some(format!(
            "{}/{}",
            db.get_documents_path(),
            segments[..segments.len() - 1].join("/")
        ))
    };
    Ok((collection_id, parent))
}

fn parse_document_path(db: &FirestoreDb, path: &str) -> Result<(String, String, String)> {
    let segments = split_segments(path);
    if segments.len() < 2 || segments.len() % 2 != 0 {
        return Err(AppError::InvalidPath(path.to_string()));
    }
    let document_id = segments.last().unwrap().to_string();
    let collection_id = segments[segments.len() - 2].to_string();
    let parent = if segments.len() == 2 {
        db.get_documents_path().clone()
    } else {
        format!(
            "{}/{}",
            db.get_documents_path(),
            segments[..segments.len() - 2].join("/")
        )
    };
    Ok((collection_id, document_id, parent))
}

fn split_segments(path: &str) -> Vec<&str> {
    path.split('/')
        .filter(|segment| !segment.is_empty())
        .collect()
}

fn document_to_model(doc: Document, db: &FirestoreDb) -> Result<FirestoreDocument> {
    let path = relative_document_path(db, &doc.name);
    let id = path.rsplit('/').next().unwrap_or_default().to_string();
    let data = FirestoreDb::deserialize_doc_to::<JsonValue>(&doc)?;
    Ok(FirestoreDocument {
        id,
        path,
        data,
        create_time: doc.create_time.as_ref().map(timestamp_to_string),
        update_time: doc.update_time.as_ref().map(timestamp_to_string),
    })
}

fn relative_document_path(db: &FirestoreDb, name: &str) -> String {
    let prefix = format!("{}/", db.get_documents_path());
    name.strip_prefix(&prefix).unwrap_or(name).to_string()
}

fn timestamp_to_string(ts: &Timestamp) -> String {
    DateTime::<Utc>::from_timestamp(ts.seconds, ts.nanos as u32)
        .unwrap_or_else(|| DateTime::<Utc>::from_timestamp(0, 0).unwrap())
        .to_rfc3339()
}

fn parent_or_root(db: &FirestoreDb, parent: &Option<String>) -> String {
    parent
        .clone()
        .unwrap_or_else(|| db.get_documents_path().clone())
}

fn json_to_document(db: &FirestoreDb, data: &JsonValue, name: Option<String>) -> Result<Document> {
    let object = data
        .as_object()
        .ok_or_else(|| AppError::InvalidPayload("Document payload must be a JSON object".into()))?;
    let fields = json_object_to_map(db, object)?;
    Ok(Document {
        name: name.unwrap_or_default(),
        fields,
        create_time: None,
        update_time: None,
    })
}

fn json_object_to_map(
    db: &FirestoreDb,
    object: &serde_json::Map<String, JsonValue>,
) -> Result<HashMap<String, Value>> {
    let mut map = HashMap::new();
    for (key, value) in object {
        map.insert(key.clone(), json_to_value(db, value)?);
    }
    Ok(map)
}

fn json_to_value(db: &FirestoreDb, value: &JsonValue) -> Result<Value> {
    let value_type =
        match value {
            JsonValue::Null => ValueType::NullValue(0),
            JsonValue::Bool(boolean) => ValueType::BooleanValue(*boolean),
            JsonValue::Number(number) => {
                if let Some(int_value) = number.as_i64() {
                    ValueType::IntegerValue(int_value)
                } else {
                    ValueType::DoubleValue(
                        number.as_f64().ok_or_else(|| {
                            AppError::InvalidPayload("Invalid number literal".into())
                        })?,
                    )
                }
            }
            JsonValue::String(text) => ValueType::StringValue(text.clone()),
            JsonValue::Array(items) => {
                let values = items
                    .iter()
                    .map(|item| json_to_value(db, item))
                    .collect::<Result<Vec<_>>>()?;
                ValueType::ArrayValue(ArrayValue { values })
            }
            JsonValue::Object(object) => {
                if let Some(type_tag) = object
                    .get("__type")
                    .or_else(|| object.get("__type__"))
                    .and_then(|tag| tag.as_str())
                {
                    match type_tag {
                        "timestamp" => {
                            let seconds =
                                object.get("seconds").and_then(|v| v.as_i64()).ok_or_else(
                                    || AppError::InvalidPayload("Timestamp missing seconds".into()),
                                )?;
                            let nanos = object
                                .get("nanos")
                                .and_then(|v| v.as_i64())
                                .unwrap_or_default() as i32;
                            ValueType::TimestampValue(Timestamp { seconds, nanos })
                        }
                        "geo" => {
                            let lat =
                                object.get("lat").and_then(|v| v.as_f64()).ok_or_else(|| {
                                    AppError::InvalidPayload("GeoPoint missing lat".into())
                                })?;
                            let lng =
                                object.get("lng").and_then(|v| v.as_f64()).ok_or_else(|| {
                                    AppError::InvalidPayload("GeoPoint missing lng".into())
                                })?;
                            ValueType::GeoPointValue(LatLng {
                                latitude: lat,
                                longitude: lng,
                            })
                        }
                        "reference" => {
                            let path =
                                object.get("path").and_then(|v| v.as_str()).ok_or_else(|| {
                                    AppError::InvalidPayload("Reference missing path".into())
                                })?;
                            let reference = if path.starts_with(db.get_documents_path().as_str()) {
                                path.to_string()
                            } else {
                                format!("{}/{}", db.get_documents_path(), path.trim_matches('/'))
                            };
                            ValueType::ReferenceValue(reference)
                        }
                        "bytes" => {
                            let encoded = object
                                .get("base64")
                                .and_then(|v| v.as_str())
                                .ok_or_else(|| {
                                    AppError::InvalidPayload("Bytes missing base64 string".into())
                                })?;
                            let decoded = BASE64_STANDARD
                                .decode(encoded.as_bytes())
                                .map_err(|_| AppError::InvalidPayload("Invalid base64".into()))?;
                            ValueType::BytesValue(decoded)
                        }
                        _ => {
                            return Err(AppError::InvalidPayload(format!(
                                "Unknown type tag {type_tag}"
                            )));
                        }
                    }
                } else {
                    let map = json_object_to_map(db, object)?;
                    ValueType::MapValue(MapValue { fields: map })
                }
            }
        };

    Ok(Value {
        value_type: Some(value_type),
    })
}
