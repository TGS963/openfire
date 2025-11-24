# Build Guide Overview: Open Source Firefoo Alternative

This documentation provides a detailed, step-by-step guide to building the Open Source Firefoo Alternative. It is designed for a senior engineer or a pair-programming team to follow sequentially.

## Prerequisites
- **Rust**: Latest stable version (`rustup update`)
- **Node.js**: v18+ or v20+ (LTS)
- **Package Manager**: `pnpm` (recommended) or `npm`/`yarn`
- **Tauri CLI**: `cargo install tauri-cli --version "^2.0.0"` (or use via npm)
- **OS Dependencies**: 
    - Linux: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
    - macOS/Windows: Standard build tools (Xcode Command Line Tools / Visual Studio C++ Build Tools).

## Module Structure

This guide is broken down into the following phases:

1.  **[01_initialization.md](./01_initialization.md)**
    - Scaffolding the Tauri v2 app.
    - Setting up the React + Vite frontend.
    - Configuring TailwindCSS and Shadcn/UI.
    - Setting up project-wide linting and formatting.

2.  **[02_rust_backend.md](./02_rust_backend.md)**
    - Setting up the Rust workspace.
    - Implementing the Firestore client using gRPC.
    - Defining the internal data structures and serialization logic.
    - Creating the Service Account Connection Manager.

3.  **[03_basic_ui.md](./03_basic_ui.md)**
    - Building the Application Shell (Layout).
    - Creating the Navigation/Sidebar.
    - Setting up the Global State (Zustand) and Async State (TanStack Query).
    - Integrating the Monaco Editor.

4.  **[04_read_operations.md](./04_read_operations.md)**
    - Wiring `list_collections` and `get_documents`.
    - Implementing the Virtualized Data Table.
    - Handling complex Firestore types in the UI.
    - Implementing Pagination.

5.  **[05_write_operations.md](./05_write_operations.md)**
    - Building the Document Editor form.
    - Implementing `update_document` and `delete_document` in Rust.
    - Handling Optimistic Updates in the UI.

6.  **[06_refinement.md](./06_refinement.md)**
    - Polishing the UI/UX (Toast notifications, Loading states).
    - Implementing Dark/Light mode.
    - Packaging and Build Configuration.

## Philosophy
- **Type Safety**: Use TypeScript extensively in the frontend and Rust's type system in the backend. Use `ts-rs` or manual type syncing to ensure the bridge is safe.
- **Performance**: Do not block the UI thread. Heavy operations go to Rust threads. Large lists are virtualized.
- **Simplicity**: Keep dependencies minimal. Don't add a library unless it solves a hard problem.
