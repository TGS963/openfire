# Step 2: Rust Backend Implementation

## 2.1. Structure the Rust Code
We will organize the backend to keep `main.rs` clean.

**Directory Layout**:
```
src-tauri/
├── src/
│   ├── main.rs          # Entry point, command registration
│   ├── lib.rs           # Shared library logic
│   ├── error.rs         # Custom error handling
│   ├── commands/
│   │   ├── mod.rs
│   │   ├── auth.rs      # Service Account handling
│   │   └── data.rs      # CRUD operations
│   └── state/
│       ├── mod.rs
│       └── app_state.rs # Global application state (active connection)
```

## 2.2. Application State (`state/app_state.rs`)
We need to store the active Firestore client in memory. Since we might have multiple connections later, let's plan for that, but start with a single active client wrapped in a `Mutex`.

```rust
use std::sync::Mutex;
use firestore::FirestoreDb;

pub struct AppState {
    pub db_client: Mutex<Option<FirestoreDb>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            db_client: Mutex::new(None),
        }
    }
}
```

## 2.3. Error Handling (`error.rs`)
Create a unified error type that implements `serde::Serialize` so we can return meaningful errors to the frontend.

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Firestore error: {0}")]
    Firestore(#[from] firestore::errors::FirestoreError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Authentication failed: {0}")]
    Auth(String),
}

// Implement Serialize to pass errors to frontend
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
```

## 2.4. Authentication Command (`commands/auth.rs`)
Implement the command to load a Service Account JSON file and initialize the Firestore client.

```rust
use crate::state::app_state::AppState;
use crate::error::AppError;
use tauri::State;
use firestore::FirestoreDb;

#[tauri::command]
pub async fn connect_with_service_account(
    file_path: String,
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    // 1. Read project_id from the JSON file (simplified parsing)
    // 2. Initialize FirestoreDb using the file path
    let db = FirestoreDb::with_options_service_account_key_file(
        firestore::FirestoreDbOptions::new("detected-project-id".to_string()),
        file_path.into()
    ).await?;

    // 3. Store in state
    let mut client_guard = state.db_client.lock().unwrap();
    *client_guard = Some(db);

    Ok("Connected successfully".to_string())
}
```

## 2.5. Data Commands (`commands/data.rs`)
Implement basic listing of collections and documents.

```rust
use crate::state::app_state::AppState;
use crate::error::AppError;
use tauri::State;
use firestore::FirestoreDb;

#[tauri::command]
pub async fn list_collections(state: State<'_, AppState>) -> Result<Vec<String>, AppError> {
    let guard = state.db_client.lock().unwrap();
    let db = guard.as_ref().ok_or(AppError::Auth("Not connected".to_string()))?;
    
    // Use firestore crate method to list collections
    let collections = db.list_collection_ids().await?;
    Ok(collections)
}

#[tauri::command]
pub async fn get_documents(
    collection: String, 
    limit: usize, 
    state: State<'_, AppState>
) -> Result<Vec<serde_json::Value>, AppError> {
    // Logic to fetch documents and serialize them to generic JSON
    // We use serde_json::Value because documents have dynamic schemas
    todo!("Implement fetching with limit")
}
```

## 2.6. Register Commands in `main.rs`
Wire everything together.

```rust
fn main() {
    tauri::Builder::default()
        .manage(state::app_state::AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::auth::connect_with_service_account,
            commands::data::list_collections,
            commands::data::get_documents
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```
