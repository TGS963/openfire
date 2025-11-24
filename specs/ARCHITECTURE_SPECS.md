# Technical Specifications: "OpenFire" (Working Title)

## 1. Executive Summary
A high-performance, cross-platform desktop client for Firebase, designed as an open-source alternative to Firefoo. Built with Tauri (Rust) for the backend and React (TypeScript) for the frontend, emphasizing speed, security, and a native look and feel.

## 2. Technology Stack

### Frontend (The View)
-   **Framework:** React 18+
-   **Language:** TypeScript
-   **Build Tool:** Vite
-   **State Management:** Zustand (Minimalist, hook-based)
-   **UI Framework:** TailwindCSS + Radix UI / Shadcn UI (Headless accessibility with full styling control)
-   **Code Editor:** `@monaco-editor/react` (For JSON editing)
-   **Data Fetching:** TanStack Query (React Query) - for caching and async state management.
-   **Routing:** React Router (or simple state-based routing if single window).

### Backend (The Controller)
-   **Core:** Tauri v2 (Rust)
-   **HTTP Client:** `reqwest` (Rust) - For communicating with Firebase REST APIs directly.
-   **Async Runtime:** `tokio`
-   **Serialization:** `serde` / `serde_json` - High-performance JSON handling between Rust and JS.
-   **Key Storage:** `tauri-plugin-store` or system keychain integration for saving Service Account keys.

## 3. Architecture & Design Patterns

### 3.1. The "Rust-First" Networking Model
Unlike web-based Firebase consoles, we will not use the Firebase JS SDK in the frontend for data operations. Instead, we utilize the **Firebase REST API** or **gRPC** via Rust.
*   **Why?**
    *   **CORS Avoidance:** Desktop apps shouldn't worry about CORS.
    *   **Performance:** Parsing massive JSON datasets in Rust is faster before sending only the viewport data to the UI.
    *   **Privileges:** We need to act as an Admin via Service Accounts, which is easier to manage securely in the backend process.

### 3.2. IPC Communication (Inter-Process Communication)
Communication between React and Rust happens via Tauri Commands.
-   `invoke('get_collection_data', { path: 'users', limit: 50 })`
-   Events: Rust emits events like `download-progress` or `auth-state-changed` to the frontend.

### 3.3. Security Model
-   **Service Accounts:** User provides a `serviceAccount.json`. This file is **never** sent to a third-party server. It is read by the Rust process and used to generate Bearer tokens for the Google APIs.
-   **Token Management:** Rust manages the OAuth2 flow to exchange the service account JWT for an access token.
-   **Sandboxing:** The WebView is strictly isolated. No Node.js in the WebView.

## 4. Core Feature Specifications

### 4.1. Connection Manager
-   **Input:** Drag & drop `serviceAccount.json`.
-   **Storage:** Encrypted local storage of the file path or content (user choice).
-   **Multi-project:** Sidebar to switch between different Firebase projects instantly.

### 4.2. Firestore Explorer
-   **Layout:** Three-pane layout (Collections -> Documents -> Data/Fields).
-   **Virtualization:** The document list must support scrolling through thousands of documents without DOM lag.
-   **Filtering:**
    -   UI Builder: "Field" "Operator" "Value" rows.
    -   Translates to structured queries sent to Rust.
-   **Data Types:**
    -   Must accurately display and edit: `string`, `number`, `boolean`, `map`, `array`, `null`, `timestamp`, `geopoint`, `reference`.

### 4.3. Keyboard Accessibility
-   `Cmd/Ctrl + P`: Quick open (Collections/Documents).
-   `Cmd/Ctrl + S`: Save changes in the editor.
-   `Cmd/Ctrl + R`: Refresh data.

## 5. Data Flow (Example: Fetching Documents)
1.  **React:** User clicks "users" collection. `useQuery` triggers.
2.  **React:** Calls `invoke('firestore_list_docs', { path: 'users' })`.
3.  **Rust:** Receives command. Checks for cached Access Token. If expired, refreshes via Google Auth.
4.  **Rust:** Constructs HTTP GET request to `firestore.googleapis.com/v1/...`.
5.  **Rust:** Receives raw REST JSON.
6.  **Rust:** (Optional) Transformed to a simpler structure if needed, or passed raw.
7.  **React:** Receives data, updates Query Cache, renders table.

## 6. Development Guidelines
-   **KISS:** Do not over-abstract the Firebase API. Map it 1:1 where possible.
-   **Type Safety:** Shared TypeScript types generated from Rust structs (using `ts-rs` or similar) to ensure contract safety.
-   **Error Handling:** All Rust errors must be serialized to a standard `AppError` object for the UI to display toast notifications.

