//! Google OAuth loopback spike — prints access + refresh tokens.
//!
//! Run:
//!   GOOGLE_OAUTH_CLIENT_ID=<id> cargo run
//!
//! Flow: spawn loopback HTTP on 127.0.0.1:<random> → open browser to Google
//! consent URL with PKCE challenge → receive code on callback → exchange for
//! access + refresh tokens. No client secret — desktop "Installed app" OAuth
//! client type relies on PKCE.

use std::env;
use std::net::TcpListener;

use anyhow::{anyhow, Context, Result};
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, CsrfToken, PkceCodeChallenge, RedirectUrl, Scope,
    TokenResponse, TokenUrl,
};
use tiny_http::{Response, Server};
use url::Url;

const AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL: &str = "https://oauth2.googleapis.com/token";

// Scopes the OpenFire connection-picker spike needs:
//   openid+email → identify the signed-in user
//   cloudplatformprojects.readonly → list GCP projects via Resource Manager
//   firebase → list Firebase-enabled projects via Firebase Management API
//   datastore → read/write Firestore data
const SCOPES: &[&str] = &[
    "openid",
    "email",
    "https://www.googleapis.com/auth/cloudplatformprojects.readonly",
    "https://www.googleapis.com/auth/firebase",
    "https://www.googleapis.com/auth/datastore",
];

#[tokio::main]
async fn main() -> Result<()> {
    let client_id = env::var("GOOGLE_OAUTH_CLIENT_ID")
        .context("GOOGLE_OAUTH_CLIENT_ID env var not set — create a Desktop OAuth client in Google Cloud Console first")?;

    // Bind an ephemeral loopback port first so the redirect_uri we register
    // with Google matches what tiny_http actually listens on.
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let port = listener.local_addr()?.port();
    let redirect = format!("http://127.0.0.1:{port}/callback");
    println!("loopback redirect: {redirect}");

    let client = BasicClient::new(
        ClientId::new(client_id),
        None,
        AuthUrl::new(AUTH_URL.to_string())?,
        Some(TokenUrl::new(TOKEN_URL.to_string())?),
    )
    .set_redirect_uri(RedirectUrl::new(redirect)?);

    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let mut auth_builder = client.authorize_url(CsrfToken::new_random);
    for scope in SCOPES {
        auth_builder = auth_builder.add_scope(Scope::new((*scope).to_string()));
    }
    let (auth_url, csrf_token) = auth_builder
        .set_pkce_challenge(pkce_challenge)
        // Refresh tokens are only returned when access_type=offline and the
        // user is prompted for consent at least once.
        .add_extra_param("access_type", "offline")
        .add_extra_param("prompt", "consent")
        .url();

    println!("opening browser to consent screen…");
    if webbrowser::open(auth_url.as_str()).is_err() {
        println!("(could not auto-open browser — paste this URL manually:)");
        println!("{auth_url}");
    }

    // Hand the bound TcpListener to tiny_http so the OS-assigned port is the
    // one we receive on. We synchronously wait for the first matching request.
    let server = Server::from_listener(listener, None)
        .map_err(|err| anyhow!("could not start loopback server: {err}"))?;
    let (code, state) = wait_for_callback(&server)?;

    if state.secret() != csrf_token.secret() {
        anyhow::bail!("CSRF state mismatch — possible attack, aborting");
    }

    println!("got auth code, exchanging for token…");
    let token = client
        .exchange_code(code)
        .set_pkce_verifier(pkce_verifier)
        .request_async(async_http_client)
        .await
        .context("token exchange failed")?;

    println!();
    println!("=== SUCCESS ===");
    println!("access_token: {}", token.access_token().secret());
    if let Some(refresh) = token.refresh_token() {
        println!("refresh_token: {}", refresh.secret());
    } else {
        println!("(no refresh_token — consent flow may have been previously approved; try a fresh Google account or revoke prior consent)");
    }
    if let Some(expires) = token.expires_in() {
        println!("expires_in: {}s", expires.as_secs());
    }
    println!();
    println!("test calls:");
    println!("  curl -H 'Authorization: Bearer <access_token>' https://firebase.googleapis.com/v1beta1/projects");
    println!("  curl -H 'Authorization: Bearer <access_token>' https://firestore.googleapis.com/v1/projects/<PROJECT_ID>/databases");
    println!("  curl -H 'Authorization: Bearer <access_token>' 'https://firestore.googleapis.com/v1/projects/<PROJECT_ID>/databases/(default)/documents/<COLLECTION>'");

    Ok(())
}

fn wait_for_callback(server: &Server) -> Result<(AuthorizationCode, CsrfToken)> {
    for request in server.incoming_requests() {
        let url = format!("http://127.0.0.1{}", request.url());
        let parsed = Url::parse(&url)?;
        if parsed.path() != "/callback" {
            // Browsers may probe /favicon.ico etc; ignore.
            let _ = request.respond(Response::from_string("not found").with_status_code(404));
            continue;
        }
        let mut code: Option<String> = None;
        let mut state: Option<String> = None;
        let mut err: Option<String> = None;
        for (k, v) in parsed.query_pairs() {
            match k.as_ref() {
                "code" => code = Some(v.into_owned()),
                "state" => state = Some(v.into_owned()),
                "error" => err = Some(v.into_owned()),
                _ => {}
            }
        }
        let body = if err.is_some() {
            "<h2>Sign-in failed.</h2><p>You can close this tab.</p>"
        } else {
            "<h2>Signed in.</h2><p>Return to the terminal.</p>"
        };
        let _ = request.respond(
            Response::from_string(body)
                .with_header(
                    "Content-Type: text/html; charset=utf-8"
                        .parse::<tiny_http::Header>()
                        .unwrap(),
                ),
        );
        if let Some(err) = err {
            anyhow::bail!("consent screen returned error: {err}");
        }
        let code = code.ok_or_else(|| anyhow!("callback missing code"))?;
        let state = state.ok_or_else(|| anyhow!("callback missing state"))?;
        return Ok((AuthorizationCode::new(code), CsrfToken::new(state)));
    }
    Err(anyhow!("loopback server stopped before callback"))
}
