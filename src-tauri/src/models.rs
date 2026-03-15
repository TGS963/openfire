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

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryFilter {
    pub field: String,
    pub operator: FilterOperator,
    pub value: Value,
}

#[derive(Debug, Clone, Deserialize)]
pub enum FilterOperator {
    #[serde(rename = "==")]
    Equal,
    #[serde(rename = "!=")]
    NotEqual,
    #[serde(rename = "<")]
    LessThan,
    #[serde(rename = "<=")]
    LessThanOrEqual,
    #[serde(rename = ">")]
    GreaterThan,
    #[serde(rename = ">=")]
    GreaterThanOrEqual,
    #[serde(rename = "array-contains")]
    ArrayContains,
    #[serde(rename = "in")]
    In,
    #[serde(rename = "array-contains-any")]
    ArrayContainsAny,
    #[serde(rename = "not-in")]
    NotIn,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryOrderBy {
    pub field: String,
    pub direction: SortDirection,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SortDirection {
    Asc,
    Desc,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuerySpec {
    pub collection_path: String,
    pub filters: Vec<QueryFilter>,
    pub order_by: Vec<QueryOrderBy>,
    pub limit: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ImportMode {
    CreateOnly,
    Overwrite,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub imported: u32,
    pub skipped: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionInfo {
    pub mode: String,
    pub project_id: String,
    pub emulator_url: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferResult {
    pub transferred: u32,
    pub skipped: u32,
}
