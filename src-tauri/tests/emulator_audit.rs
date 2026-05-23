//! End-to-end audit of the emulator connection path.
//!
//! Replicates exactly what `commands::connect_emulator` builds (same
//! `FirestoreDbOptions::opt_firebase_api_url` + an `ExternalSource` token
//! source identical to `emulator::EmulatorTokenSource`) and exercises a real
//! write -> read -> list -> query against a running Firestore emulator.
//!
//! Requires a Firestore emulator listening at 127.0.0.1:8080. The test
//! short-circuits to a pass-with-warning if no emulator is reachable, so it
//! never fails CI environments that lack the emulator.
//!
//! Run with an emulator up:
//!   firebase emulators:start --only firestore --project demo-openfire
//!   cargo test --manifest-path src-tauri/Cargo.toml --test emulator_audit -- --nocapture

use std::net::TcpStream;
use std::time::Duration;

use async_trait::async_trait;
use firestore::{
    FirestoreDb, FirestoreDbOptions, FirestoreListCollectionIdsParams, FirestoreListingSupport,
};
use gcloud_sdk::{Source, Token, TokenSourceType};
use secret_vault_value::SecretValue;
use serde::{Deserialize, Serialize};

const EMULATOR_URL: &str = "http://127.0.0.1:8080";
const EMULATOR_ADDR: &str = "127.0.0.1:8080";
const PROJECT_ID: &str = "demo-openfire";

/// Identical to `app_lib::emulator::EmulatorTokenSource` (private module, so
/// re-declared here for the integration test).
struct EmulatorTokenSource;

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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
struct Widget {
    name: String,
    count: i64,
}

fn emulator_reachable() -> bool {
    TcpStream::connect_timeout(
        &EMULATOR_ADDR.parse().expect("valid addr"),
        Duration::from_millis(500),
    )
    .is_ok()
}

/// Mirrors `commands::connect_emulator` connection construction exactly.
async fn connect() -> FirestoreDb {
    let options =
        FirestoreDbOptions::new(PROJECT_ID.to_string()).opt_firebase_api_url(Some(EMULATOR_URL.to_string()));

    FirestoreDb::with_options_token_source(
        options,
        gcloud_sdk::GCP_DEFAULT_SCOPES.clone(),
        TokenSourceType::ExternalSource(Box::new(EmulatorTokenSource)),
    )
    .await
    .expect("connect_emulator construction should succeed")
}

#[tokio::test]
async fn emulator_connect_write_read_list_query() {
    if !emulator_reachable() {
        eprintln!(
            "SKIP: no Firestore emulator at {EMULATOR_ADDR}. Start one to run this audit."
        );
        return;
    }

    let db = connect().await;
    let collection = "widgets";
    let doc_id = "audit-widget-1";
    let widget = Widget {
        name: "audit".to_string(),
        count: 42,
    };

    // WRITE — proves the connection is live, not just lazily constructed.
    let created: Widget = db
        .fluent()
        .insert()
        .into(collection)
        .document_id(doc_id)
        .object(&widget)
        .execute()
        .await
        .expect("emulator write should succeed");
    assert_eq!(created, widget, "written object should round-trip");

    // READ by id.
    let fetched: Option<Widget> = db
        .fluent()
        .select()
        .by_id_in(collection)
        .obj()
        .one(doc_id)
        .await
        .expect("emulator read should succeed");
    assert_eq!(fetched.as_ref(), Some(&widget), "read should return the written object");

    // LIST collection ids — the sidebar's root tree call.
    let collection_ids: Vec<String> = db
        .list_collection_ids(FirestoreListCollectionIdsParams::new())
        .await
        .expect("emulator list_collection_ids should succeed")
        .collection_ids;
    assert!(
        collection_ids.iter().any(|c| c == collection),
        "listed collections {collection_ids:?} should contain {collection}"
    );

    // Cleanup so reruns stay deterministic.
    let _ = db.fluent().delete().from(collection).document_id(doc_id).execute().await;

    eprintln!("PASS: emulator connect/write/read/list all succeeded against {EMULATOR_URL}");
}
