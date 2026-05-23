# google-oauth-spike

Standalone Rust binary. Verifies the Google OAuth loopback + PKCE flow works
end-to-end before committing to it as OpenFire's third connection method.

## What it does

1. Spawns an HTTP server on `127.0.0.1:<random>`.
2. Opens the system browser to Google's consent screen with PKCE.
3. Receives the authorization code on the loopback callback.
4. Exchanges the code (with the PKCE verifier) for `access_token` + `refresh_token`.
5. Prints both, plus three ready-made `curl` commands that exercise the APIs
   the connection picker will eventually call.

## One-time setup

1. Open <https://console.cloud.google.com/apis/credentials>.
2. Pick the GCP project that should own the OAuth client (any project you
   own — it doesn't have to be a Firebase project).
3. **Create credentials → OAuth client ID → Application type: Desktop app**.
4. Copy the client ID (looks like `123-abc.apps.googleusercontent.com`).
5. On the OAuth consent screen, add the scopes the spike requests:
   - `openid`
   - `email`
   - `https://www.googleapis.com/auth/cloudplatformprojects.readonly`
   - `https://www.googleapis.com/auth/firebase`
   - `https://www.googleapis.com/auth/datastore`
6. While the consent screen is in "Testing" mode, add your Google account as
   a test user.

No client secret is needed — PKCE makes a secretless desktop flow safe.

## Run

```bash
cd spike/google-oauth
GOOGLE_OAUTH_CLIENT_ID=123-abc.apps.googleusercontent.com cargo run
```

A browser tab opens. After consent, the terminal prints:

```
access_token: ya29...
refresh_token: 1//0g...
expires_in: 3599s
```

## Verify the token works

```bash
ACCESS=ya29...

# 1. Firebase Management — projects the user can see
curl -s -H "Authorization: Bearer $ACCESS" \
  https://firebase.googleapis.com/v1beta1/projects | jq

# 2. Cloud Firestore admin — databases inside one project
PROJECT=my-firebase-project
curl -s -H "Authorization: Bearer $ACCESS" \
  https://firestore.googleapis.com/v1/projects/$PROJECT/databases | jq

# 3. Cloud Firestore data — list documents in a collection
curl -s -H "Authorization: Bearer $ACCESS" \
  "https://firestore.googleapis.com/v1/projects/$PROJECT/databases/(default)/documents/users?pageSize=5" | jq
```

If all three return JSON (not `{"error":...}`), the spike is green and the
real implementation can proceed: refresh-token storage in the OS keyring,
loopback + PKCE inside Tauri, and a project/database picker.

## Out of scope for the spike

- Token refresh loop.
- Keyring storage.
- Multi-database picker UI.
- Tauri integration.
- Error UX for blocked OAuth apps (Workspace org policy).
