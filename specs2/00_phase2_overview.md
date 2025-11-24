# Phase 2: Real Data & State Persistence

This phase focuses on transforming the mock-up UI into a functional application connected to real Firebase instances.

## Goals

1.  **Rust Backend**: Implement Tauri commands to handle Firebase Service Account credentials and perform Firestore read operations.
2.  **State Management**: persist application state (selected project, credentials) and cache remote data using TanStack Query.
3.  **Security**: Securely handle and store Service Account keys.

## Roadmap

### 1. Rust Backend (`src-tauri`)
- [ ] **Credential Management**:
    - `import_service_account(path)`: Read and validate a JSON key file.
    - `list_service_accounts()`: Return available accounts.
    - `set_active_account(id)`: Initialize Firestore client.
- [ ] **Firestore Operations**:
    - `list_collections(path)`: List collections at root or under a document.
    - `list_documents(collection_path, limit, offset)`: List documents with pagination.
    - `get_document(path)`: Get a single document.

### 2. Frontend Architecture (`src`)
- [ ] **State Stores (Zustand)**:
    - `useAuthStore`: Manage available credentials and active session.
    - `useNavStore`: Manage current navigation path in the Firestore tree.
- [ ] **Data Fetching (TanStack Query)**:
    - Implement hooks wrapping Tauri commands (`useCollections`, `useDocuments`).
    - Configure caching and invalidation policies.
- [ ] **UI Integration**:
    - Replace mock data in `Sidebar`, `CollectionList`, and `DocumentView`.
    - Add "Add Account" flow to the initial view.

### 3. Security & Storage
- [ ] **Credential Storage**:
    - Store Service Account JSONs in the App Data directory (locally encrypted if possible, or OS keychain for the path/key).
    - For this MVP, we will copy the JSON files to the `app_local_data_dir` under a `credentials` folder.
