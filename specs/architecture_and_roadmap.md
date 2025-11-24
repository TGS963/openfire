# Project Spec: OpenFire (Firefoo Alternative)

## 1. Executive Summary
**Goal**: Build a high-performance, open-source, cross-platform Firebase GUI client.
**Target Audience**: Developers using Firestore/Realtime Database who need a native-feeling, fast tool for data management.
**Key Differentiators**:
- **Speed**: Built on Tauri (Rust) for minimal resource usage compared to Electron.
- **Privacy**: Local-first credential storage. No tracking.
- **Developer Experience**: Modern React UI, keyboard-centric workflows.

## 2. Technology Stack

### Core
- **Frontend**: React 18+ (TypeScript)
- **Build Tool**: Vite
- **Backend/Host**: Tauri v2 (Rust)
- **Styling**: Tailwind CSS + shadcn/ui (for accessible, clean components)
- **State Management**: Zustand (global UI state), TanStack Query (server state/caching)
- **Editor**: Monaco Editor (for JSON editing)

### Connectivity
- **Firebase Interaction**: 
  - Primary: Rust-based gRPC/REST client for Firestore (via `gcloud-sdk` or similar Rust crates) for maximum performance and avoiding Node.js dependency.
  - Fallback: Direct JS SDK usage for Auth/Client-side emulation if needed, but "Admin" features require Service Account integration handled securely in the Rust backend.

## 3. Architecture Overview

### 3.1. The Tauri Backend (Rust)
The Rust layer acts as the secure bridge between the OS and the UI.
- **Responsibilities**:
  - **Credential Management**: Securely storing Service Account JSONs (using OS keychain via `keyring` crate).
  - **Data Fetching**: Executing high-performance Firestore queries via gRPC/REST.
  - **File System**: Exporting/Importing JSON/CSV dumps.
  - **Window Management**: Native menu bars, multiple windows support.

### 3.2. The React Frontend
The UI is a "dumb" presentation layer that requests data from Rust commands.
- **Responsibilities**:
  - **Virtualization**: Rendering lists of thousands of documents efficiently (using `react-virtuoso` or `tanstack-virtual`).
  - **Query Building**: Visual interface for `where`, `orderBy`, `limit`.
  - **JSON Editing**: Robust JSON editor for document fields.

## 4. Feature Specification

### Phase 1: Foundation & Connection (MVP)
- [ ] **Project Management**:
  - Add/Remove Firebase Projects via Service Account JSON.
  - Local secure storage of credentials.
- [ ] **Collection Browser**:
  - List top-level collections.
  - List sub-collections.
- [ ] **Document List**:
  - Infinite scroll / Virtualized list of document IDs.
  - Basic column view (ID + preview of fields).

### Phase 2: Read & Query Capabilities
- [ ] **Document Inspector**:
  - View document data in Tree View and raw JSON View.
  - Copy field paths/values.
- [ ] **Query Builder**:
  - UI for compound queries (AND/OR).
  - Sorting and Limiting.
  - Real-time updates (optional toggle).

### Phase 3: Write Operations
- [ ] **CRUD Operations**:
  - Create new document (auto-ID vs custom ID).
  - Edit fields (optimistic UI updates).
  - Delete documents/collections (recursive delete support in Rust).
- [ ] **Batch Operations**:
  - Import JSON/CSV.
  - Export collection to JSON/CSV.

### Phase 4: Advanced Features (Differentiation)
- [ ] **Lua/JS Scripting**: Run local scripts against the database (embedded engine).
- [ ] **Tab Interface**: Multiple tabs for different collections/projects.
- [ ] **Command Palette**: `Cmd+K` navigation for everything.

## 5. Technical Guidelines & Standards

### 5.1. Performance
- **Virtualization**: NEVER render a full collection list. Always use virtualization.
- **Lazy Loading**: Fetch sub-collections only on expansion.
- **Rust Async**: All file I/O and network requests must be async in Rust to avoid blocking the main thread.

### 5.2. Security
- **Secrets**: Service Account keys never leave the user's machine.
- **Sanitization**: No `dangerouslySetInnerHTML` without strict sanitization.

### 5.3. Code Style (KISS & DRY)
- **React**: Functional components. Custom hooks for logic.
- **Rust**: Error propagation via `Result`. usage of `serde` for seamless frontend-backend type sharing.
- **Typing**: Shared TypeScript types generated from Rust structs (using `ts-rs` or similar).

## 6. Action Plan

1.  **Scaffold**: Initialize Tauri + React + TypeScript + Vite project.
2.  **Rust Core**: Implement basic Firestore connection test using a Service Account.
3.  **UI Shell**: Build the sidebar (collections) and main area (doc list) using `shadcn/ui`.
4.  **Data Bridge**: Wire up Rust commands to React Query for fetching collections/docs.
5.  **Detail View**: Implement Monaco Editor for document details.
6.  **Iterate**: Add writing capabilities and query filtering.
