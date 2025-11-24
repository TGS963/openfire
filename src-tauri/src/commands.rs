use crate::credentials::CredentialManager;
use crate::error::{AppError, Result};
use crate::models::{CollectionList, DocumentPage, FirestoreDocument, ServiceAccountSummary};
use crate::state::AppState;
use chrono::{DateTime, Utc};
use firestore::{
    FirestoreDb, FirestoreDbOptions, FirestoreGetByIdSupport, FirestoreListCollectionIdsParams,
    FirestoreListDocParams, FirestoreListingSupport,
};
use gcloud_sdk::google::firestore::v1::Document;
use prost_types::Timestamp;
use serde_json::Value;
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
    let data = FirestoreDb::deserialize_doc_to::<Value>(&doc)?;
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
