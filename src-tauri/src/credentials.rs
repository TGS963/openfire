use crate::error::{AppError, Result};
use crate::models::{ServiceAccountMetadata, ServiceAccountSummary};
use serde::Deserialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use uuid::Uuid;

const CREDENTIAL_EXTENSION: &str = "json";

#[derive(Clone)]
pub struct CredentialManager {
    base_dir: Arc<PathBuf>,
}

impl CredentialManager {
    pub fn new(base_dir: PathBuf) -> Result<Self> {
        if !base_dir.exists() {
            fs::create_dir_all(&base_dir)?;
        }
        Ok(Self {
            base_dir: Arc::new(base_dir),
        })
    }

    pub fn base_dir(&self) -> &Path {
        self.base_dir.as_ref()
    }

    pub fn save_from_path<P: AsRef<Path>>(&self, source: P) -> Result<ServiceAccountSummary> {
        let content = fs::read_to_string(source.as_ref())?;
        let metadata = Self::parse_metadata(&content)?;
        let id = format!("{}-{}", metadata.project_id, Uuid::new_v4());
        let destination = self.path_for(&id);
        fs::write(&destination, content)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&destination, fs::Permissions::from_mode(0o600))?;
        }

        Ok(ServiceAccountSummary {
            id,
            project_id: metadata.project_id,
            client_email: metadata.client_email,
        })
    }

    pub fn list(&self) -> Result<Vec<ServiceAccountSummary>> {
        let mut entries = Vec::new();
        if !self.base_dir().exists() {
            return Ok(entries);
        }

        for entry in fs::read_dir(self.base_dir())? {
            let entry = entry?;
            let is_json = entry
                .path()
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| ext == CREDENTIAL_EXTENSION)
                .unwrap_or(false);
            if !is_json {
                continue;
            }
            let content = fs::read_to_string(entry.path())?;
            if let Ok(metadata) = Self::parse_metadata(&content) {
                if let Some(stem) = entry.path().file_stem().and_then(|s| s.to_str()) {
                    entries.push(ServiceAccountSummary {
                        id: stem.to_string(),
                        project_id: metadata.project_id,
                        client_email: metadata.client_email,
                    });
                }
            }
        }

        entries.sort_by(|a, b| a.project_id.cmp(&b.project_id));
        Ok(entries)
    }

    pub fn load_metadata(&self, id: &str) -> Result<ServiceAccountMetadata> {
        let path = self.path_for(id);
        if !path.exists() {
            return Err(AppError::CredentialNotFound(id.to_string()));
        }
        let content = fs::read_to_string(path)?;
        Self::parse_metadata(&content)
    }

    pub fn credential_path(&self, id: &str) -> Result<PathBuf> {
        let path = self.path_for(id);
        if path.exists() {
            Ok(path)
        } else {
            Err(AppError::CredentialNotFound(id.to_string()))
        }
    }

    fn path_for(&self, id: &str) -> PathBuf {
        self.base_dir().join(format!("{id}.{CREDENTIAL_EXTENSION}"))
    }

    fn parse_metadata(content: &str) -> Result<ServiceAccountMetadata> {
        let metadata: RawServiceAccount = serde_json::from_str(content).map_err(|_| {
            AppError::InvalidCredentials("file is not a valid service account JSON")
        })?;
        if metadata.project_id.is_empty() || metadata.client_email.is_empty() {
            return Err(AppError::InvalidCredentials(
                "missing project_id or client_email",
            ));
        }
        Ok(ServiceAccountMetadata {
            project_id: metadata.project_id,
            client_email: metadata.client_email,
        })
    }
}

#[derive(Debug, Deserialize)]
struct RawServiceAccount {
    #[serde(rename = "project_id")]
    project_id: String,
    #[serde(rename = "client_email")]
    client_email: String,
}
