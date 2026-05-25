use crate::credentials::CredentialManager;
use crate::emulator::EmulatorTokenSource;
use crate::error::{AppError, Result};
use crate::models::{
    CollectionList, ConnectionInfo, DocumentPage, FilterOperator, FirestoreDocument, ImportMode,
    ImportResult, QuerySpec, ServiceAccountSummary, SortDirection, TransferResult,
};
use crate::state::{AppState, ConnectionEntry, ConnectionMode};
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use chrono::{DateTime, Utc};
use firestore::errors::FirestoreError;
use firestore::{
    FirestoreAggregatedQueryParams, FirestoreAggregatedQuerySupport, FirestoreAggregation,
    FirestoreAggregationOperator, FirestoreAggregationOperatorCount, FirestoreCreateSupport,
    FirestoreDb, FirestoreDbOptions, FirestoreDeleteSupport, FirestoreGetByIdSupport,
    FirestoreListCollectionIdsParams, FirestoreListDocParams, FirestoreListingSupport,
    FirestoreQueryCollection, FirestoreQueryDirection, FirestoreQueryFilter,
    FirestoreQueryFilterCompare, FirestoreQueryFilterComposite, FirestoreQueryOrder,
    FirestoreQueryParams, FirestoreQuerySupport, FirestoreUpdateSupport, FirestoreValue,
};
use gcloud_sdk::google::firestore::v1::value::ValueType;
use gcloud_sdk::google::firestore::v1::{ArrayValue, Document, MapValue, Value};
use gcloud_sdk::google::r#type::LatLng;
use gcloud_sdk::TokenSourceType;
use prost_types::Timestamp;
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use tauri::State;

type CmdResult<T> = std::result::Result<T, String>;

#[tauri::command]
pub fn open_external(url: String) -> CmdResult<()> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("only http(s) URLs allowed".into());
    }
    #[cfg(target_os = "linux")]
    let cmd = "xdg-open";
    #[cfg(target_os = "macos")]
    let cmd = "open";
    #[cfg(target_os = "windows")]
    let cmd = "explorer";
    std::process::Command::new(cmd)
        .arg(&url)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

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

    let project_id = metadata.project_id.clone();
    let db = FirestoreDb::with_options_service_account_key_file(
        FirestoreDbOptions::new(metadata.project_id),
        credential_path,
    )
    .await
    .map_err(|err| err.to_string())?;

    let conn_id = format!("prod-{}", project_id);
    app_state.add_connection(conn_id, db, ConnectionMode::Production).await;
    Ok(summary)
}

#[tauri::command]
pub async fn list_collections(
    app_state: State<'_, AppState>,
    parent_path: Option<String>,
    page_size: Option<usize>,
    page_token: Option<String>,
) -> CmdResult<CollectionList> {
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let params = FirestoreListCollectionIdsParams {
        parent: normalize_parent_path(&db, parent_path).map_err(|err| err.to_string())?,
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
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (collection_id, parent) =
        parse_collection_path(&db, &collection_path).map_err(|err| err.to_string())?;
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
        .map_err(|err| err.to_string())?;
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
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (collection_id, document_id, parent) =
        parse_document_path(&db, &document_path).map_err(|err| err.to_string())?;
    let document = db
        .get_doc_at(&parent, &collection_id, document_id, None)
        .await
        .map_err(|err| err.to_string())?;
    document_to_model(document, &db).map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn save_document(
    app_state: State<'_, AppState>,
    document_path: String,
    data: JsonValue,
) -> CmdResult<FirestoreDocument> {
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (collection_id, document_id, parent) =
        parse_document_path(&db, &document_path).map_err(|err| err.to_string())?;
    let full_name = format!("{}/{}/{}", parent, collection_id, document_id);
    let mut serialized = json_to_document(&db, &data, Some(full_name.clone()))
        .map_err(|err| err.to_string())?;

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

    app_state.clear_count_cache().await;
    document_to_model(updated, &db).map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn duplicate_document(
    app_state: State<'_, AppState>,
    source_path: String,
    target_path: String,
    overwrite: Option<bool>,
) -> CmdResult<FirestoreDocument> {
    let overwrite = overwrite.unwrap_or(false);
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (source_collection, source_id, source_parent) =
        parse_document_path(&db, &source_path).map_err(|err| err.to_string())?;
    let (target_collection, target_id, target_parent) =
        parse_document_path(&db, &target_path).map_err(|err| err.to_string())?;

    let mut source = db
        .get_doc_at(&source_parent, &source_collection, source_id, None)
        .await
        .map_err(|err| err.to_string())?;

    let exists = db
        .get_doc_at(&target_parent, &target_collection, &target_id, None)
        .await;

    let result = match exists {
        Ok(_) if overwrite => {
            source.name = format!("{}/{}/{}", target_parent, target_collection, target_id);
            db.update_doc(&target_collection, source, None, None, None)
                .await
                .map_err(|err| err.to_string())?
        }
        Ok(_) => {
            return Err(format!(
                "Document {} already exists under {}",
                target_id, target_collection
            ));
        }
        Err(FirestoreError::DataNotFoundError(_)) => {
            source.name.clear();
            db.create_doc_at(
                &target_parent,
                &target_collection,
                Some(target_id.clone()),
                source,
                None,
            )
            .await
            .map_err(|err| err.to_string())?
        }
        Err(err) => return Err(err.to_string()),
    };

    app_state.clear_count_cache().await;
    document_to_model(result, &db).map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn duplicate_collection(
    app_state: State<'_, AppState>,
    source_collection_path: String,
    target_collection_path: String,
    overwrite: Option<bool>,
) -> CmdResult<u32> {
    let overwrite = overwrite.unwrap_or(false);
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (source_collection, source_parent) =
        parse_collection_path(&db, &source_collection_path).map_err(|err| err.to_string())?;
    let (target_collection, target_parent) =
        parse_collection_path(&db, &target_collection_path).map_err(|err| err.to_string())?;
    let target_parent_path = parent_or_root(&db, &target_parent);

    let copied = for_each_doc_in_collection(&db, &source_collection, &source_parent, |mut doc| {
        let db = db.clone();
        let target_parent_path = target_parent_path.clone();
        let target_collection = target_collection.clone();
        async move {
            let doc_id = extract_doc_id(&doc.name)?;

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

            Ok(true)
        }
    })
    .await?;
    app_state.clear_count_cache().await;
    Ok(copied)
}

#[tauri::command]
pub async fn delete_document(
    app_state: State<'_, AppState>,
    document_path: String,
) -> CmdResult<()> {
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (collection_id, document_id, parent) =
        parse_document_path(&db, &document_path).map_err(|err| err.to_string())?;
    db.delete_by_id_at(&parent, &collection_id, &document_id, None)
        .await
        .map_err(|err| err.to_string())?;
    app_state.clear_count_cache().await;
    Ok(())
}

#[tauri::command]
pub async fn delete_collection(
    app_state: State<'_, AppState>,
    collection_path: String,
) -> CmdResult<u32> {
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (collection_id, parent) =
        parse_collection_path(&db, &collection_path).map_err(|err| err.to_string())?;
    let parent_path = parent_or_root(&db, &parent);

    let removed = for_each_doc_in_collection(&db, &collection_id, &parent, |doc| {
        let db = db.clone();
        let parent_path = parent_path.clone();
        let collection_id = collection_id.clone();
        async move {
            let doc_id = extract_doc_id(&doc.name)?;
            db.delete_by_id_at(&parent_path, &collection_id, &doc_id, None)
                .await
                .map_err(|err| err.to_string())?;
            Ok(true)
        }
    })
    .await?;
    app_state.clear_count_cache().await;
    Ok(removed)
}

#[tauri::command]
pub async fn query_documents(
    app_state: State<'_, AppState>,
    query: QuerySpec,
) -> CmdResult<DocumentPage> {
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let params = build_query_params(&db, &query).map_err(|err| err.to_string())?;
    let docs: Vec<Document> = db.query_doc(params).await.map_err(|err| err.to_string())?;
    let documents = docs
        .into_iter()
        .map(|doc| document_to_model(doc, &db))
        .collect::<Result<Vec<_>>>()
        .map_err(|err| err.to_string())?;
    Ok(DocumentPage {
        documents,
        next_page_token: None,
    })
}

/// Exact document count for a collection via Firestore COUNT() aggregation —
/// one cheap server-side query, no documents downloaded.
#[tauri::command]
pub async fn count_documents(
    app_state: State<'_, AppState>,
    collection_path: String,
) -> CmdResult<u64> {
    let cache_key = app_state.count_cache_key(&collection_path).await;
    if let Some(key) = &cache_key {
        if let Some(count) = app_state.cached_count(key).await {
            return Ok(count);
        }
    }

    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (collection_id, parent) =
        parse_collection_path(&db, &collection_path).map_err(|err| err.to_string())?;
    let query_params = FirestoreQueryParams::new(FirestoreQueryCollection::Single(collection_id))
        .opt_parent(parent);
    let params = FirestoreAggregatedQueryParams::new(
        query_params,
        vec![FirestoreAggregation::new("count".to_string()).with_operator(
            FirestoreAggregationOperator::Count(FirestoreAggregationOperatorCount::new()),
        )],
    );
    let docs = db
        .aggregated_query_doc(params)
        .await
        .map_err(|err| err.to_string())?;
    let count = count_from_aggregated_docs(&docs);

    if let Some(key) = cache_key {
        app_state.store_count(key, count).await;
    }
    Ok(count)
}

/// Pull the integer under the "count" alias from an aggregation response.
fn count_from_aggregated_docs(docs: &[Document]) -> u64 {
    docs.first()
        .and_then(|doc| doc.fields.get("count"))
        .and_then(|value| match &value.value_type {
            Some(ValueType::IntegerValue(n)) => Some(*n),
            _ => None,
        })
        .map(|n| n.max(0) as u64)
        .unwrap_or(0)
}

fn build_query_params(db: &FirestoreDb, query: &QuerySpec) -> Result<FirestoreQueryParams> {
    let (collection_id, parent) = parse_collection_path(db, &query.collection_path)?;
    let mut params =
        FirestoreQueryParams::new(FirestoreQueryCollection::Single(collection_id))
            .opt_parent(parent);

    if let Some(limit) = query.limit {
        params = params.with_limit(limit);
    }

    if !query.order_by.is_empty() {
        let orders: Vec<FirestoreQueryOrder> = query
            .order_by
            .iter()
            .map(|o| {
                let direction = match o.direction {
                    SortDirection::Desc => FirestoreQueryDirection::Descending,
                    SortDirection::Asc => FirestoreQueryDirection::Ascending,
                };
                FirestoreQueryOrder::new(o.field.clone(), direction)
            })
            .collect();
        params = params.with_order_by(orders);
    }

    if !query.filters.is_empty() {
        let comparisons: Vec<FirestoreQueryFilterCompare> = query
            .filters
            .iter()
            .map(|f| build_filter_compare(db, f))
            .collect::<Result<Vec<_>>>()?;

        let filter = if comparisons.len() == 1 {
            FirestoreQueryFilter::Compare(Some(comparisons.into_iter().next().unwrap()))
        } else {
            FirestoreQueryFilter::Composite(FirestoreQueryFilterComposite::new(
                comparisons
                    .into_iter()
                    .map(|c| FirestoreQueryFilter::Compare(Some(c)))
                    .collect(),
                firestore::FirestoreQueryFilterCompositeOperator::And,
            ))
        };
        params = params.with_filter(filter);
    }

    Ok(params)
}

fn build_filter_compare(
    db: &FirestoreDb,
    filter: &crate::models::QueryFilter,
) -> Result<FirestoreQueryFilterCompare> {
    let field = filter.field.clone();
    let value = FirestoreValue::from(json_to_value(db, &filter.value)?);
    Ok(match filter.operator {
        FilterOperator::Equal => FirestoreQueryFilterCompare::Equal(field, value),
        FilterOperator::NotEqual => FirestoreQueryFilterCompare::NotEqual(field, value),
        FilterOperator::LessThan => FirestoreQueryFilterCompare::LessThan(field, value),
        FilterOperator::LessThanOrEqual => FirestoreQueryFilterCompare::LessThanOrEqual(field, value),
        FilterOperator::GreaterThan => FirestoreQueryFilterCompare::GreaterThan(field, value),
        FilterOperator::GreaterThanOrEqual => FirestoreQueryFilterCompare::GreaterThanOrEqual(field, value),
        FilterOperator::ArrayContains => FirestoreQueryFilterCompare::ArrayContains(field, value),
        FilterOperator::In => FirestoreQueryFilterCompare::In(field, value),
        FilterOperator::ArrayContainsAny => FirestoreQueryFilterCompare::ArrayContainsAny(field, value),
        FilterOperator::NotIn => FirestoreQueryFilterCompare::NotIn(field, value),
    })
}

#[tauri::command]
pub async fn export_collection(
    app_state: State<'_, AppState>,
    collection_path: String,
    file_path: String,
) -> CmdResult<u32> {
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (collection_id, parent) =
        parse_collection_path(&db, &collection_path).map_err(|err| err.to_string())?;

    let (docs, count) =
        export_collection_recursive(&db, &collection_id, &parent).await?;

    let json_str =
        serde_json::to_string_pretty(&docs).map_err(|err| err.to_string())?;
    let path = file_path.clone();
    tokio::task::spawn_blocking(move || std::fs::write(&path, json_str))
        .await
        .map_err(|err| format!("export task join failed: {err}"))?
        .map_err(|err| format!("export file write failed ({file_path}): {err}"))?;

    Ok(count)
}

#[tauri::command]
pub async fn import_collection(
    app_state: State<'_, AppState>,
    collection_path: String,
    file_path: String,
    mode: ImportMode,
) -> CmdResult<ImportResult> {
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let (collection_id, parent) =
        parse_collection_path(&db, &collection_path).map_err(|err| err.to_string())?;
    let parent_path = parent_or_root(&db, &parent);

    let path = file_path.clone();
    let raw = tokio::task::spawn_blocking(move || std::fs::read_to_string(&path))
        .await
        .map_err(|err| format!("import task join failed: {err}"))?
        .map_err(|err| format!("import file read failed ({file_path}): {err}"))?;

    let entries: Vec<JsonValue> =
        serde_json::from_str(&raw).map_err(|err| err.to_string())?;

    let mut imported = 0u32;
    let mut skipped = 0u32;

    for entry in entries {
        let obj = entry
            .as_object()
            .ok_or_else(|| "Each entry must be a JSON object".to_string())?;

        let doc_id = obj
            .get("__id__")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Each entry must have a string \"__id__\" field".to_string())?
            .to_string();

        let mut data_map = obj.clone();
        data_map.remove("__id__");
        let data = JsonValue::Object(data_map);

        let full_name = format!("{}/{}/{}", parent_path, collection_id, doc_id);
        let doc = json_to_document(&db, &data, Some(full_name.clone()))
            .map_err(|err| err.to_string())?;

        let exists = db
            .get_doc_at(&parent_path, &collection_id, &doc_id, None)
            .await;

        match exists {
            Ok(_) if matches!(mode, ImportMode::CreateOnly) => {
                skipped += 1;
                continue;
            }
            Ok(_) => {
                db.update_doc(&collection_id, doc, None, None, None)
                    .await
                    .map_err(|err| err.to_string())?;
            }
            Err(FirestoreError::DataNotFoundError(_)) => {
                let mut new_doc = doc;
                new_doc.name.clear();
                db.create_doc_at(
                    &parent_path,
                    &collection_id,
                    Some(doc_id),
                    new_doc,
                    None,
                )
                .await
                .map_err(|err| err.to_string())?;
            }
            Err(err) => return Err(err.to_string()),
        }
        imported += 1;
    }

    app_state.clear_count_cache().await;
    Ok(ImportResult { imported, skipped })
}

#[tauri::command]
pub async fn connect_emulator(
    app_state: State<'_, AppState>,
    project_id: String,
    emulator_url: String,
) -> CmdResult<ConnectionInfo> {
    let options = FirestoreDbOptions::new(project_id.clone())
        .opt_firebase_api_url(Some(emulator_url.clone()));

    let db = FirestoreDb::with_options_token_source(
        options,
        gcloud_sdk::GCP_DEFAULT_SCOPES.clone(),
        TokenSourceType::ExternalSource(Box::new(EmulatorTokenSource)),
    )
    .await
    .map_err(|err| err.to_string())?;

    app_state
        .set_db(
            db,
            ConnectionMode::Emulator {
                url: emulator_url.clone(),
                project_id: project_id.clone(),
            },
        )
        .await;

    Ok(ConnectionInfo {
        mode: "emulator".to_string(),
        project_id,
        emulator_url: Some(emulator_url),
    })
}

#[tauri::command]
pub async fn disconnect_emulator(app_state: State<'_, AppState>) -> CmdResult<()> {
    app_state.clear_db().await;
    Ok(())
}

/// Cheap liveness round-trip against the active connection. Lists collection
/// ids with page_size 1 — proves the DB actually answers, for both production
/// and emulator. Errors if no active connection or the request fails (emulator
/// down, network gone, creds revoked).
#[tauri::command]
pub async fn ping_connection(app_state: State<'_, AppState>) -> CmdResult<()> {
    let db = app_state.db().await.map_err(|err| err.to_string())?;
    let params = FirestoreListCollectionIdsParams {
        parent: normalize_parent_path(&db, None).map_err(|err| err.to_string())?,
        page_size: 1,
        page_token: None,
    };
    db.list_collection_ids(params)
        .await
        .map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_connection_info(app_state: State<'_, AppState>) -> CmdResult<Option<ConnectionInfo>> {
    let mode = app_state.connection_mode().await;
    Ok(mode.map(|m| match m {
        ConnectionMode::Production => ConnectionInfo {
            mode: "production".to_string(),
            project_id: String::new(),
            emulator_url: None,
        },
        ConnectionMode::Emulator { url, project_id } => ConnectionInfo {
            mode: "emulator".to_string(),
            project_id,
            emulator_url: Some(url),
        },
    }))
}

#[tauri::command]
pub async fn list_connections(
    app_state: State<'_, AppState>,
) -> CmdResult<Vec<ConnectionEntry>> {
    Ok(app_state.list_connections().await)
}

#[tauri::command]
pub async fn remove_connection(
    app_state: State<'_, AppState>,
    connection_id: String,
) -> CmdResult<()> {
    app_state.remove_connection(&connection_id).await;
    Ok(())
}

#[tauri::command]
pub async fn set_active_connection(
    app_state: State<'_, AppState>,
    connection_id: String,
) -> CmdResult<()> {
    app_state
        .set_active(&connection_id)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn transfer_documents(
    app_state: State<'_, AppState>,
    source_connection_id: String,
    dest_connection_id: String,
    source_collection_path: String,
    dest_collection_path: String,
    overwrite: Option<bool>,
) -> CmdResult<TransferResult> {
    let overwrite = overwrite.unwrap_or(false);
    let source_db = app_state
        .db_for(&source_connection_id)
        .await
        .map_err(|err| err.to_string())?;
    let dest_db = app_state
        .db_for(&dest_connection_id)
        .await
        .map_err(|err| err.to_string())?;

    let (source_collection, source_parent) =
        parse_collection_path(&source_db, &source_collection_path)
            .map_err(|err| err.to_string())?;
    let (dest_collection, dest_parent) =
        parse_collection_path(&dest_db, &dest_collection_path)
            .map_err(|err| err.to_string())?;
    let dest_parent_path = parent_or_root(&dest_db, &dest_parent);

    let skipped = std::sync::Arc::new(std::sync::atomic::AtomicU32::new(0));

    let transferred = for_each_doc_in_collection(&source_db, &source_collection, &source_parent, |doc| {
        let source_db = source_db.clone();
        let dest_db = dest_db.clone();
        let dest_parent_path = dest_parent_path.clone();
        let dest_collection = dest_collection.clone();
        let skipped = skipped.clone();
        async move {
            let model =
                document_to_model(doc, &source_db).map_err(|err| err.to_string())?;
            let doc_id = model.id.clone();
            let full_name = format!("{}/{}/{}", dest_parent_path, dest_collection, doc_id);
            let dest_doc = json_to_document(&dest_db, &model.data, Some(full_name))
                .map_err(|err| err.to_string())?;

            let exists = dest_db
                .get_doc_at(&dest_parent_path, &dest_collection, &doc_id, None)
                .await;

            match exists {
                Ok(_) if overwrite => {
                    dest_db
                        .update_doc(&dest_collection, dest_doc, None, None, None)
                        .await
                        .map_err(|err| err.to_string())?;
                    Ok(true)
                }
                Ok(_) => {
                    skipped.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    Ok(false)
                }
                Err(FirestoreError::DataNotFoundError(_)) => {
                    let mut new_doc = dest_doc;
                    new_doc.name.clear();
                    dest_db
                        .create_doc_at(
                            &dest_parent_path,
                            &dest_collection,
                            Some(doc_id),
                            new_doc,
                            None,
                        )
                        .await
                        .map_err(|err| err.to_string())?;
                    Ok(true)
                }
                Err(err) => Err(err.to_string()),
            }
        }
    })
    .await?;

    app_state.clear_count_cache().await;
    Ok(TransferResult {
        transferred,
        skipped: skipped.load(std::sync::atomic::Ordering::Relaxed),
    })
}

async fn run_blocking<F, T>(func: F) -> CmdResult<T>
where
    F: FnOnce() -> Result<T> + Send + 'static,
    T: Send + 'static,
{
    let join_result = tauri::async_runtime::spawn_blocking(func)
        .await
        .map_err(|err| err.to_string())?;
    join_result.map_err(|err| err.to_string())
}

fn extract_doc_id(name: &str) -> std::result::Result<String, String> {
    name.rsplit('/')
        .next()
        .ok_or_else(|| "Invalid Firestore document name".to_string())
        .map(String::from)
}

async fn export_collection_recursive(
    db: &FirestoreDb,
    collection_id: &str,
    parent: &Option<String>,
) -> std::result::Result<(Vec<JsonValue>, u32), String> {
    // Collect all raw documents first
    let raw_docs = std::sync::Arc::new(tokio::sync::Mutex::new(Vec::<(String, String, serde_json::Map<String, JsonValue>)>::new()));

    for_each_doc_in_collection(db, collection_id, parent, |doc| {
        let db = db.clone();
        let raw_docs = raw_docs.clone();
        async move {
            let full_name = doc.name.clone();
            let model = document_to_model(doc, &db).map_err(|err| err.to_string())?;
            let mut obj = match model.data {
                JsonValue::Object(map) => map,
                _ => serde_json::Map::new(),
            };
            obj.insert("__id__".to_string(), JsonValue::String(model.id));
            raw_docs.lock().await.push((full_name, model.path, obj));
            Ok(true)
        }
    })
    .await?;

    let raw_docs = std::sync::Arc::try_unwrap(raw_docs)
        .map_err(|_| "internal error: export buffer still shared after collection".to_string())?
        .into_inner();
    let mut all_docs = Vec::<JsonValue>::new();
    let mut total_count = raw_docs.len() as u32;

    for (full_name, _doc_path, mut obj) in raw_docs {
        // Check for subcollections under this document
        let sub_params = FirestoreListCollectionIdsParams {
            parent: Some(full_name.clone()),
            page_size: 100,
            page_token: None,
        };
        let sub_result = db
            .list_collection_ids(sub_params)
            .await
            .map_err(|err| err.to_string())?;

        if !sub_result.collection_ids.is_empty() {
            let mut subcollections = serde_json::Map::new();
            let doc_parent = Some(full_name);
            for sub_col_id in &sub_result.collection_ids {
                let (sub_docs, sub_count) =
                    Box::pin(export_collection_recursive(db, sub_col_id, &doc_parent))
                        .await?;
                subcollections.insert(sub_col_id.clone(), JsonValue::Array(sub_docs));
                total_count += sub_count;
            }
            obj.insert(
                "__subcollections__".to_string(),
                JsonValue::Object(subcollections),
            );
        }

        all_docs.push(JsonValue::Object(obj));
    }

    Ok((all_docs, total_count))
}

async fn for_each_doc_in_collection<F, Fut>(
    db: &FirestoreDb,
    collection_id: &str,
    parent: &Option<String>,
    mut handler: F,
) -> std::result::Result<u32, String>
where
    F: FnMut(Document) -> Fut,
    Fut: std::future::Future<Output = std::result::Result<bool, String>>,
{
    let mut count = 0u32;
    let mut page_token: Option<String> = None;

    loop {
        let params = FirestoreListDocParams {
            collection_id: collection_id.to_string(),
            parent: parent.clone(),
            page_size: 200,
            page_token: page_token.clone(),
            order_by: None,
            return_only_fields: None,
        };
        let page = db.list_doc(params).await.map_err(|err| err.to_string())?;
        let next_token = page.page_token.clone();

        for doc in page.documents.into_iter() {
            if handler(doc).await? {
                count += 1;
            }
        }

        if is_pagination_exhausted(next_token.as_deref()) {
            break;
        }
        page_token = next_token;
    }

    Ok(count)
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
    let collection_id = segments
        .last()
        .ok_or_else(|| AppError::InvalidPath(path.to_string()))?
        .to_string();
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
    let document_id = segments
        .last()
        .ok_or_else(|| AppError::InvalidPath(path.to_string()))?
        .to_string();
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

fn is_pagination_exhausted(token: Option<&str>) -> bool {
    token.map(|t| t.is_empty()).unwrap_or(true)
}

fn split_segments(path: &str) -> Vec<&str> {
    path.split('/')
        .filter(|segment| !segment.is_empty())
        .collect()
}

fn document_to_model(doc: Document, db: &FirestoreDb) -> Result<FirestoreDocument> {
    let path = relative_document_path(db, &doc.name);
    let id = path.rsplit('/').next().unwrap_or_default().to_string();
    let docs_path = db.get_documents_path();
    let data = JsonValue::Object(
        doc.fields
            .iter()
            .map(|(key, value)| (key.clone(), value_to_json(docs_path.as_str(), value)))
            .collect(),
    );
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
        .unwrap_or(DateTime::<Utc>::UNIX_EPOCH)
        .to_rfc3339()
}

fn value_to_json(documents_path: &str, value: &Value) -> JsonValue {
    match &value.value_type {
        None | Some(ValueType::NullValue(_)) => JsonValue::Null,
        Some(ValueType::BooleanValue(b)) => JsonValue::Bool(*b),
        Some(ValueType::IntegerValue(n)) => JsonValue::from(*n),
        Some(ValueType::DoubleValue(d)) => JsonValue::from(*d),
        Some(ValueType::StringValue(s)) => JsonValue::String(s.clone()),
        Some(ValueType::TimestampValue(ts)) => serde_json::json!({
            "__type__": "timestamp",
            "seconds": ts.seconds,
            "nanos": ts.nanos,
        }),
        Some(ValueType::GeoPointValue(latlng)) => serde_json::json!({
            "__type__": "geopoint",
            "latitude": latlng.latitude,
            "longitude": latlng.longitude,
        }),
        Some(ValueType::ReferenceValue(name)) => {
            let prefix = format!("{documents_path}/");
            let path = name.strip_prefix(&prefix).unwrap_or(name);
            serde_json::json!({ "__type__": "reference", "path": path })
        }
        Some(ValueType::BytesValue(bytes)) => serde_json::json!({
            "__type__": "bytes",
            "base64": BASE64_STANDARD.encode(bytes),
        }),
        Some(ValueType::ArrayValue(array)) => JsonValue::Array(
            array
                .values
                .iter()
                .map(|item| value_to_json(documents_path, item))
                .collect(),
        ),
        Some(ValueType::MapValue(map)) => JsonValue::Object(
            map.fields
                .iter()
                .map(|(key, item)| (key.clone(), value_to_json(documents_path, item)))
                .collect(),
        ),
    }
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
                        "geo" | "geopoint" => {
                            let lat = object
                                .get("latitude")
                                .or_else(|| object.get("lat"))
                                .and_then(|v| v.as_f64())
                                .ok_or_else(|| {
                                    AppError::InvalidPayload("GeoPoint missing latitude".into())
                                })?;
                            let lng = object
                                .get("longitude")
                                .or_else(|| object.get("lng"))
                                .and_then(|v| v.as_f64())
                                .ok_or_else(|| {
                                    AppError::InvalidPayload("GeoPoint missing longitude".into())
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_segments_normal() {
        assert_eq!(split_segments("users/doc1"), vec!["users", "doc1"]);
    }

    #[test]
    fn test_split_segments_empty() {
        assert_eq!(split_segments(""), Vec::<&str>::new());
    }

    #[test]
    fn test_split_segments_leading_trailing_slashes() {
        assert_eq!(split_segments("/users/doc1/"), vec!["users", "doc1"]);
    }

    #[test]
    fn test_split_segments_double_slashes() {
        assert_eq!(split_segments("users//doc1"), vec!["users", "doc1"]);
    }

    #[test]
    fn test_split_segments_deep_path() {
        assert_eq!(
            split_segments("users/123/posts/456/comments"),
            vec!["users", "123", "posts", "456", "comments"]
        );
    }

    #[test]
    fn test_timestamp_to_string() {
        let ts = Timestamp { seconds: 0, nanos: 0 };
        assert_eq!(timestamp_to_string(&ts), "1970-01-01T00:00:00+00:00");
    }

    #[test]
    fn test_timestamp_to_string_with_date() {
        let ts = Timestamp { seconds: 1709913600, nanos: 0 };
        let result = timestamp_to_string(&ts);
        assert!(result.starts_with("2024-03-08"));
    }

    #[test]
    fn test_extract_doc_id_normal() {
        assert_eq!(extract_doc_id("projects/p/databases/d/documents/users/abc123").unwrap(), "abc123");
    }

    #[test]
    fn test_extract_doc_id_simple() {
        assert_eq!(extract_doc_id("users/doc1").unwrap(), "doc1");
    }

    #[test]
    fn test_extract_doc_id_single_segment() {
        assert_eq!(extract_doc_id("doc1").unwrap(), "doc1");
    }

    fn count_doc(n: i64) -> Document {
        let mut fields = HashMap::new();
        fields.insert(
            "count".to_string(),
            Value { value_type: Some(ValueType::IntegerValue(n)) },
        );
        Document { name: String::new(), fields, create_time: None, update_time: None }
    }

    #[test]
    fn test_count_from_aggregated_docs_reads_integer() {
        assert_eq!(count_from_aggregated_docs(&[count_doc(12840)]), 12840);
    }

    #[test]
    fn test_count_from_aggregated_docs_empty_is_zero() {
        assert_eq!(count_from_aggregated_docs(&[]), 0);
    }

    #[test]
    fn test_count_from_aggregated_docs_missing_alias_is_zero() {
        let doc = Document {
            name: String::new(),
            fields: HashMap::new(),
            create_time: None,
            update_time: None,
        };
        assert_eq!(count_from_aggregated_docs(&[doc]), 0);
    }

    #[test]
    fn test_count_from_aggregated_docs_negative_clamped() {
        assert_eq!(count_from_aggregated_docs(&[count_doc(-5)]), 0);
    }

    const DOCS_PATH: &str = "projects/p/databases/(default)/documents";

    fn val(vt: ValueType) -> Value {
        Value { value_type: Some(vt) }
    }

    #[test]
    fn test_value_to_json_scalars() {
        assert_eq!(value_to_json(DOCS_PATH, &val(ValueType::NullValue(0))), JsonValue::Null);
        assert_eq!(value_to_json(DOCS_PATH, &val(ValueType::BooleanValue(true))), serde_json::json!(true));
        assert_eq!(value_to_json(DOCS_PATH, &val(ValueType::IntegerValue(42))), serde_json::json!(42));
        assert_eq!(value_to_json(DOCS_PATH, &val(ValueType::DoubleValue(1.5))), serde_json::json!(1.5));
        assert_eq!(
            value_to_json(DOCS_PATH, &val(ValueType::StringValue("hi".into()))),
            serde_json::json!("hi")
        );
    }

    #[test]
    fn test_value_to_json_timestamp_is_tagged() {
        let ts = val(ValueType::TimestampValue(Timestamp { seconds: 1709913600, nanos: 250 }));
        assert_eq!(
            value_to_json(DOCS_PATH, &ts),
            serde_json::json!({ "__type__": "timestamp", "seconds": 1709913600, "nanos": 250 })
        );
    }

    #[test]
    fn test_value_to_json_geopoint_is_tagged() {
        let gp = val(ValueType::GeoPointValue(LatLng { latitude: 12.5, longitude: -8.0 }));
        assert_eq!(
            value_to_json(DOCS_PATH, &gp),
            serde_json::json!({ "__type__": "geopoint", "latitude": 12.5, "longitude": -8.0 })
        );
    }

    #[test]
    fn test_value_to_json_reference_is_relative() {
        let r = val(ValueType::ReferenceValue(format!("{DOCS_PATH}/users/abc")));
        assert_eq!(
            value_to_json(DOCS_PATH, &r),
            serde_json::json!({ "__type__": "reference", "path": "users/abc" })
        );
    }

    #[test]
    fn test_value_to_json_bytes_is_base64() {
        let b = val(ValueType::BytesValue(vec![1, 2, 3]));
        assert_eq!(
            value_to_json(DOCS_PATH, &b),
            serde_json::json!({ "__type__": "bytes", "base64": "AQID" })
        );
    }

    #[test]
    fn test_value_to_json_nested_timestamp_in_array_and_map() {
        let ts = val(ValueType::TimestampValue(Timestamp { seconds: 5, nanos: 0 }));
        let arr = val(ValueType::ArrayValue(ArrayValue { values: vec![ts.clone()] }));
        let mut fields = HashMap::new();
        fields.insert("at".to_string(), ts);
        let map = val(ValueType::MapValue(MapValue { fields }));
        assert_eq!(
            value_to_json(DOCS_PATH, &arr),
            serde_json::json!([{ "__type__": "timestamp", "seconds": 5, "nanos": 0 }])
        );
        assert_eq!(
            value_to_json(DOCS_PATH, &map),
            serde_json::json!({ "at": { "__type__": "timestamp", "seconds": 5, "nanos": 0 } })
        );
    }
}
