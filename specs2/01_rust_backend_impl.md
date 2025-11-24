# Rust Backend Implementation Plan

## Dependencies
We are using `firestore`, `tokio`, `tauri`, `serde`, `serde_json`.
Ensure `tauri-plugin-fs` and `tauri-plugin-store` (or standard file IO) are available for credential persistence.

## 1. Application State
We need to store the active Firestore client in the Tauri application state. Since `firestore::FirestoreDb` is thread-safe (Clonable), we can store it wrapped in a `Mutex` or `RwLock` inside a managed State struct.

```rust
// src-tauri/src/lib.rs

use std::sync::Arc;
use tokio::sync::RwLock;
use firestore::FirestoreDb;

struct AppState {
    // The active Firestore client. None if no project is selected.
    db: RwLock<Option<FirestoreDb>>,
}
```

## 2. Commands

### Credential Management

#### `import_service_account`
- **Input**: `file_path: String`
- **Logic**:
    1. Read the file at `file_path`.
    2. Parse as JSON to validate it looks like a Service Account (has `project_id`, `private_key`, `client_email`).
    3. Generate a unique ID (or use `project_id` + `client_email` hash).
    4. Save the file to the App Data directory (`$APP_DATA/credentials/<id>.json`).
    5. Return the metadata (id, project_id, email).

#### `list_service_accounts`
- **Logic**:
    1. Scan `$APP_DATA/credentials/`.
    2. Read each JSON to extract metadata.
    3. Return list of accounts.

#### `set_active_account`
- **Input**: `account_id: String`
- **Logic**:
    1. Load the corresponding JSON file.
    2. Initialize `FirestoreDb::with_options_service_account_key_file(...)`.
    3. Store the `FirestoreDb` instance in `AppState`.

### Firestore Read Operations

#### `list_collections`
- **Input**: `parent_path: Option<String>`
- **Logic**:
    1. Acquire read lock on `AppState`.
    2. If `parent_path` is None, list root collections using `db.list_collection_ids(params)`.
    3. If `parent_path` is Some, usage might differ (Firestore typically lists collections *of* a document).
    *Note: Firestore API treats root collections and subcollections similarly but `firestore` crate usage needs verification.*

#### `list_documents`
- **Input**: `collection_path: String`, `page_size: usize`, `page_token: Option<String>`
- **Logic**:
    1. Use `db.fluent().select().from(collection_path).limit(page_size)`.
    2. If `page_token` is provided, use it (need to check `firestore` crate pagination support).
    3. Return `Vec<Document>` and `next_page_token`.

## 3. Data Structures

```rust
#[derive(Serialize, Deserialize)]
pub struct ServiceAccountSummary {
    pub id: String,
    pub project_id: String,
    pub client_email: String,
}

#[derive(Serialize, Deserialize)]
pub struct FirestoreDocument {
    pub id: String,
    pub path: String,
    pub data: serde_json::Value, // Raw JSON representation
}
```
