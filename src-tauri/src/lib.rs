mod commands;
mod credentials;
mod error;
mod models;
mod state;

use anyhow::Context;
use commands::*;
use credentials::CredentialManager;
use state::AppState;
use std::sync::Once;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    ensure_crypto_provider();
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let credential_dir = app
                .path()
                .app_local_data_dir()
                .context("unable to determine app data directory")?
                .join("credentials");

            let credential_manager = CredentialManager::new(credential_dir)?;
            app.manage(credential_manager);
            app.manage(AppState::default());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            import_service_account,
            list_service_accounts,
            set_active_account,
            list_collections,
            list_documents,
            get_document,
            save_document,
            duplicate_document,
            duplicate_collection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn ensure_crypto_provider() {
    static INIT: Once = Once::new();
    INIT.call_once(|| {
        rustls::crypto::aws_lc_rs::default_provider()
            .install_default()
            .expect("failed to install default crypto provider");
    });
}
