use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Credential not found: {0}")]
    CredentialNotFound(String),
    #[error("No active Firestore client set")]
    MissingFirestoreClient,
    #[error("Connection not found: {0}")]
    ConnectionNotFound(String),
    #[error("Invalid credentials file: {0}")]
    InvalidCredentials(&'static str),
    #[error("Invalid Firestore path: {0}")]
    InvalidPath(String),
    #[error("Invalid payload: {0}")]
    InvalidPayload(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    SerdeJson(#[from] serde_json::Error),
    #[error(transparent)]
    Firestore(#[from] firestore::errors::FirestoreError),
    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),
}

pub type Result<T> = std::result::Result<T, AppError>;

