use crate::error::{AppError, Result};
use firestore::FirestoreDb;
use serde::Serialize;
use std::collections::HashMap;
use tokio::sync::RwLock;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum ConnectionMode {
    Production,
    Emulator { url: String, project_id: String },
}

impl ConnectionMode {
    pub fn connection_id(&self) -> String {
        match self {
            ConnectionMode::Production => "production".to_string(),
            ConnectionMode::Emulator { project_id, .. } => format!("emu-{}", project_id),
        }
    }

    pub fn project_id_label(&self) -> String {
        match self {
            ConnectionMode::Production => String::new(),
            ConnectionMode::Emulator { project_id, .. } => project_id.clone(),
        }
    }
}

pub struct AppState {
    connections: RwLock<HashMap<String, (FirestoreDb, ConnectionMode)>>,
    active_connection_id: RwLock<Option<String>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            connections: RwLock::new(HashMap::new()),
            active_connection_id: RwLock::new(None),
        }
    }
}

impl AppState {
    /// Backward-compatible: add connection and set as active.
    pub async fn set_db(&self, db: FirestoreDb, mode: ConnectionMode) {
        let id = mode.connection_id();
        self.add_connection(id, db, mode).await;
    }

    /// Backward-compatible: remove the active connection.
    pub async fn clear_db(&self) {
        let active_id = self.active_connection_id.read().await.clone();
        if let Some(id) = active_id {
            self.remove_connection(&id).await;
        }
    }

    /// Backward-compatible: get the active connection's DB.
    pub async fn db(&self) -> Result<FirestoreDb> {
        let active_id = self.active_connection_id.read().await.clone();
        let id = active_id.ok_or(AppError::MissingFirestoreClient)?;
        self.db_for(&id).await
    }

    /// Backward-compatible: get the active connection's mode.
    pub async fn connection_mode(&self) -> Option<ConnectionMode> {
        let active_id = self.active_connection_id.read().await.clone();
        if let Some(id) = active_id {
            let conns = self.connections.read().await;
            conns.get(&id).map(|(_, mode)| mode.clone())
        } else {
            None
        }
    }

    pub async fn add_connection(&self, id: String, db: FirestoreDb, mode: ConnectionMode) {
        let mut conns = self.connections.write().await;
        conns.insert(id.clone(), (db, mode));
        let mut active = self.active_connection_id.write().await;
        *active = Some(id);
    }

    pub async fn remove_connection(&self, id: &str) {
        let mut conns = self.connections.write().await;
        conns.remove(id);
        let mut active = self.active_connection_id.write().await;
        if active.as_deref() == Some(id) {
            *active = None;
        }
    }

    pub async fn set_active(&self, id: &str) -> Result<()> {
        let conns = self.connections.read().await;
        if !conns.contains_key(id) {
            return Err(AppError::ConnectionNotFound(id.to_string()));
        }
        drop(conns);
        let mut active = self.active_connection_id.write().await;
        *active = Some(id.to_string());
        Ok(())
    }

    pub async fn db_for(&self, id: &str) -> Result<FirestoreDb> {
        let conns = self.connections.read().await;
        conns
            .get(id)
            .map(|(db, _)| db.clone())
            .ok_or_else(|| AppError::ConnectionNotFound(id.to_string()))
    }

    pub async fn active_connection_id(&self) -> Option<String> {
        self.active_connection_id.read().await.clone()
    }

    pub async fn list_connections(&self) -> Vec<ConnectionEntry> {
        let conns = self.connections.read().await;
        let active_id = self.active_connection_id.read().await;
        conns
            .iter()
            .map(|(id, (_, mode))| ConnectionEntry {
                id: id.clone(),
                mode: mode.clone(),
                is_active: active_id.as_deref() == Some(id.as_str()),
            })
            .collect()
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionEntry {
    pub id: String,
    pub mode: ConnectionMode,
    pub is_active: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_state() -> AppState {
        AppState::default()
    }

    #[tokio::test]
    async fn db_returns_error_when_no_active_connection() {
        let state = make_state();
        let result = state.db().await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn connection_mode_returns_none_when_empty() {
        let state = make_state();
        assert!(state.connection_mode().await.is_none());
    }

    #[tokio::test]
    async fn list_connections_returns_empty_initially() {
        let state = make_state();
        assert!(state.list_connections().await.is_empty());
    }

    #[tokio::test]
    async fn set_active_fails_for_nonexistent_id() {
        let state = make_state();
        let result = state.set_active("nonexistent").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn remove_connection_clears_active_if_matching() {
        let state = make_state();
        // After remove, active should be None
        state.remove_connection("anything").await;
        assert!(state.active_connection_id().await.is_none());
    }

    #[tokio::test]
    async fn db_for_fails_for_nonexistent_id() {
        let state = make_state();
        let result = state.db_for("nonexistent").await;
        assert!(result.is_err());
    }
}
