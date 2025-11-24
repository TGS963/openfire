use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceAccountSummary {
    pub id: String,
    pub project_id: String,
    pub client_email: String,
}

#[derive(Debug, Clone)]
pub struct ServiceAccountMetadata {
    pub project_id: String,
    pub client_email: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CollectionList {
    pub collection_ids: Vec<String>,
    pub next_page_token: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FirestoreDocument {
    pub id: String,
    pub path: String,
    pub data: Value,
    pub create_time: Option<String>,
    pub update_time: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentPage {
    pub documents: Vec<FirestoreDocument>,
    pub next_page_token: Option<String>,
}
