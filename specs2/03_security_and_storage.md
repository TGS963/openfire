# Security & Credential Storage

## Requirement
We need to persist Google Service Account JSON files so the user doesn't have to re-import them every time. We must treat them sensitively, although they are already files on the user's disk.

## Strategy: App Data Directory
We will copy imported Service Account files into the application's local data directory.

### 1. Path Resolution
Using Tauri's `path` API (exposed to Rust via `app.path().app_local_data_dir()`).
- Linux: `~/.local/share/com.godavsky.firebase-gui-app/credentials/`
- macOS: `~/Library/Application Support/com.godavsky.firebase-gui-app/credentials/`
- Windows: `C:\Users\...\AppData\Local\com.godavsky.firebase-gui-app\credentials\`

### 2. Security Considerations
- **Permissions**: Set file permissions to `600` (read/write only by owner) on Unix systems.
- **Encryption (Future)**: For a production app, we might encrypt these files using a key stored in the system keychain (`tauri-plugin-keytar` or similar). For this MVP, rely on OS user isolation.

### 3. Implementation Details

#### Rust Helper: `CredentialManager`
Create a module `src/credentials.rs` to handle file I/O.

```rust
pub struct CredentialManager {
    base_dir: PathBuf,
}

impl CredentialManager {
    pub fn new(app_handle: &AppHandle) -> Self { ... }
    
    pub fn save(&self, content: &str) -> Result<String> {
        // Generate ID
        // Write to file
        // Set permissions
    }
    
    pub fn list(&self) -> Vec<ServiceAccountSummary> {
        // Read dir
    }
    
    pub fn get_path(&self, id: &str) -> PathBuf { ... }
}
```

#### Initialization
- On app startup, ensure the `credentials` directory exists.

## 4. Frontend "Secure" Key Handling
- The frontend never sees the *full* private key content after import (unless explicitly requested, which we won't support yet).
- The frontend only deals with IDs and metadata (Project ID, Email).
- This prevents accidental exposure in logs/UI.
