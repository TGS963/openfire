use async_trait::async_trait;
use gcloud_sdk::{Source, Token};
use secret_vault_value::SecretValue;

pub struct EmulatorTokenSource;

#[async_trait]
impl Source for EmulatorTokenSource {
    async fn token(&self) -> gcloud_sdk::error::Result<Token> {
        Ok(Token::new(
            "Bearer".to_string(),
            SecretValue::from("owner"),
            chrono::Utc::now() + chrono::Duration::hours(1),
        ))
    }
}
