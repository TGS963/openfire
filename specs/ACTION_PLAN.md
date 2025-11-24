# Project Action Plan: Open Source Firefoo Alternative (React + Tauri)

## Phase 1: Foundation & Infrastructure
**Goal:** Initialize the project and establish the communication bridge between React and Tauri.

1.  **Project Scaffolding**
    -   Initialize Tauri app with React (TypeScript) and Vite.
    -   Setup TailwindCSS and Shadcn/UI (or similar lightweight UI library) for the frontend.
    -   Configure Rust backend structure.

2.  **State Management & Architecture**
    -   Setup global state (Zustand) for connection management.
    -   Define Tauri Command interface for Service Account file handling.
    -   Implement basic error handling and logging system.

3.  **Authentication Module**
    -   Implement Service Account (JSON) importer in Tauri.
    -   Validate Service Account credentials against Firebase REST APIs via Rust.
    -   Securely store credentials (OS Keytar/Keychain integration via Tauri plugin).

## Phase 2: Firestore Explorer (Core)
**Goal:** Build the primary interface for browsing and managing Firestore data.

1.  **Collection Browser**
    -   Implement sidebar navigation for Collections/Sub-collections.
    -   Create Rust commands to fetch collections (using Firestore REST API or Rust crate).

2.  **Document List View**
    -   Build a virtualized table/list view for documents (React Virtual).
    -   Implement pagination (cursor-based) for large collections.

3.  **Query Interface**
    -   Create a UI for `where`, `orderBy`, and `limit` clauses.
    -   Translate UI filters into Firestore queries in Rust.

4.  **Document Editor**
    -   Build a JSON editor pane (Monaco Editor or similar).
    -   Implement Field-specific editors (Timestamp, Geopoint, Reference).
    -   Create CRUD actions: Add, Update, Delete documents.

## Phase 3: Advanced Firestore Features
**Goal:** Add power-user features that distinguish the tool.

1.  **Complex Queries**
    -   Support for compound queries and collection group queries.
    -   Raw JSON query input support.

2.  **Data Operations**
    -   Import/Export collections to JSON/CSV.
    -   Batch operations (Delete all in selection).
    -   Real-time listeners (Toggleable, as this consumes reads).

3.  **Multi-tab Support**
    -   Implement a tab system to keep multiple collections/documents open.
    -   State persistence across tabs.

## Phase 4: Additional Services (Scope Extension)
**Goal:** Expand beyond Firestore.

1.  **Realtime Database Support**
    -   Tree view for RTDB.
    -   CRUD operations for RTDB nodes.

2.  **Cloud Storage**
    -   File browser interface.
    -   Upload/Download/Delete file capability.

3.  **Cloud Functions**
    -   List deployed functions.
    -   View logs (basic integration).

## Phase 5: Polish & Distribution
**Goal:** Prepare for public release.

1.  **Performance Optimization**
    -   Optimize Rust-to-JS serialization for large datasets.
    -   Minimize bundle size.

2.  **Theming & UX**
    -   Dark/Light mode toggle.
    -   Keyboard shortcuts for common actions.

3.  **CI/CD & Release**
    -   Setup GitHub Actions for building binaries (MacOS, Windows, Linux).
    -   Create automated release pipeline.
