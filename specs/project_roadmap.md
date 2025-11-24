# Project Spec: Open Source Firefoo Alternative

## 1. Executive Summary
**Goal**: Create a high-performance, cross-platform desktop application for managing Firebase projects, serving as an open-source alternative to Firefoo.
**Core Value Prop**: Speed, Privacy (Local-first), Open Source, and Developer Experience.
**Tech Stack**:
- **Core**: Tauri (v2) with Rust
- **Frontend**: React, TypeScript, Vite
- **Styling**: TailwindCSS, Shadcn/UI (Radix Primitives)
- **State Management**: Zustand + TanStack Query
- **Database Interaction**: Rust-native gRPC via `firestore` crate (or similar) for maximum performance, or direct REST fallback.

## 2. Architecture

### 2.1. The "Local-First" Philosophy
Unlike the Firebase Console, this app uses a Service Account key stored locally on the user's machine. No data passes through our servers.

### 2.2. High-Level Design
```mermaid
graph TD
    A[React Frontend] <-->|Tauri Commands / Events| B[Tauri Core (Rust)]
    B <-->|gRPC / HTTP2| C[Firebase/Google Cloud]
    B <-->|File System| D[Local Config & Keys]
```

- **Frontend**: Handles UI, virtualized tables for large datasets, JSON editing, and state.
- **Tauri (Rust)**: Handles the "heavy lifting":
    - Managing Service Account credentials safely.
    - Establishing HTTP/2 gRPC connections to Firestore.
    - Stream processing for export/import (avoiding memory bloat).
    - executing Node.js scripts (optional Phase 2 via Sidecar).

## 3. Feature Roadmap

### Phase 1: The MVP (Core Data Management)
*Focus: Read/Write/Browse*
1.  **Connection Manager**:
    - Drag & drop Service Account JSON.
    - Save profiles (encrypted locally via OS keychain if possible, or just local file for MVP).
2.  **Collection Explorer**:
    - Tree/Sidebar view of collections.
    - Infinite scroll / Virtualized list for documents (React-Virtuoso).
3.  **Document Editor**:
    - JSON Editor view (Monaco Editor).
    - Form/Field view.
    - Add/Edit/Delete fields.
4.  **Basic Querying**:
    - `Where` clauses.
    - `Order By`.
    - `Limit`.

### Phase 2: Power User Tools
*Focus: Speed & Bulk Ops*
1.  **Advanced Filtering**: multiple where clauses, startAfter (pagination).
2.  **Import/Export**:
    - Streaming JSON/CSV import/export handled by Rust (super fast).
3.  **Auth Management**:
    - List users, disable accounts, change passwords.

### Phase 3: The "Killer" Features
1.  **SQL-like Querying**: A simplified SQL layer over Firestore (parsed in Rust, converted to Firestore queries).
2.  **Scripting**: Embedded JS runtime (Deno or Boa) to run batch updates on selected rows.
3.  **Emulator Support**: Toggle between Production and Local Emulator Suite.

## 4. Detailed Technical Specifications

### 4.1. Frontend (React)
- **Component Library**: `shadcn/ui` for a professional, consistent look.
- **Data Fetching**: `TanStack Query` for caching Firestore results and optimistic updates.
- **State**: `Zustand` for global app state (current connection, theme, sidebar state).
- **Routing**: `TanStack Router` or simple conditional rendering (Desktop apps often don't need deep linking, but Router is good for Tabs).

### 4.2. Backend (Tauri/Rust)
- **Crates**:
    - `tauri`: Application framework.
    - `serde`, `serde_json`: Serialization.
    - `tokio`: Async runtime.
    - `firestore` (or `googapis`): Direct gRPC interaction with Firestore.
    - `keyring` (optional): For secure storage of service account paths/secrets.

### 4.3. Data Model (Internal)
We need a unified way to represent Firestore data that handles its specific types (Timestamp, GeoPoint, Reference) gracefully in the JSON-heavy frontend.
- **Serialization**: Custom serializers in Rust to convert Firestore gRPC types to a frontend-friendly JSON format (e.g., wrapping complex types: `{"__type": "geo", "lat": ..., "lng": ...}`).

## 5. Action Plan (Development Steps)

### Step 1: Initialization
- Scaffold Tauri + React project.
- Configure Tailwind and Shadcn/UI.
- Set up linting (Biome or ESLint + Prettier).

### Step 2: Rust Firestore Client
- Create a Rust module to handle Service Account loading.
- Implement `list_collections` and `get_document` commands.
- Test connection with a dummy Firestore project.

### Step 3: Basic UI Shell
- Create the Sidebar (Connections, Collections).
- Create the Main View (Data Table).
- Implement the "Add Connection" modal.

### Step 4: Read Operations
- Wire up `list_collections` to the Sidebar.
- Wire up `get_documents` to the Main View Table.
- Implement Pagination (or infinite scroll loading).

### Step 5: Write Operations
- Implement `update_document` command in Rust.
- Create the Edit Document panel (JSON/Form toggle).
- Implement `delete_document`.

### Step 6: Refinement
- Add Toast notifications for success/error.
- Implement "Refresh" logic.
- Add Dark/Light mode toggle.

## 6. Design Guidelines (KISS)
- **No Over-abstraction**: Don't build a generic database client. Build a *Firestore* client.
- **Native Feel**: Use system fonts, fast transitions, context menus.
- **Error Handling**: graceful degradation. If a query fails, show the raw Firestore error.

## 7. Future Considerations
- **Real-time**: Firestore supports listeners. We can implement a "Live Mode" toggle using Rust streams pushing events to the Frontend.
