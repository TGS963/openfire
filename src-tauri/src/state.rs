use crate::error::{AppError, Result};
use firestore::FirestoreDb;
use tokio::sync::RwLock;

#[derive(Default)]
pub struct AppState {
    db: RwLock<Option<FirestoreDb>>,
}

impl AppState {
    pub async fn set_db(&self, db: FirestoreDb) {
        let mut lock = self.db.write().await;
        *lock = Some(db);
    }

    pub async fn clear_db(&self) {
        let mut lock = self.db.write().await;
        *lock = None;
    }

    pub async fn db(&self) -> Result<FirestoreDb> {
        let lock = self.db.read().await;
        lock.clone().ok_or(AppError::MissingFirestoreClient)
    }
}
