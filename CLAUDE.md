# OpenFire — Firestore GUI Desktop App

OpenFire is a desktop GUI for browsing, querying, and managing Firestore databases. Tauri v2 desktop app with React frontend and Rust backend.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Rust with `firestore` crate (gRPC-based Firestore access via service accounts)
- **Desktop**: Tauri v2 — all Firebase operations happen in Rust backend, never in webview
- **State**: Zustand stores (`auth-store`, `nav-store`), TanStack Query for server state
- **Package manager**: pnpm

## Key Directories

- `src/` — React frontend
- `src/components/ui/` — shadcn/ui primitives (don't modify directly)
- `src/components/` — app components organized by feature (layout/, documents/, dialogs/, collections/, onboarding/)
- `src/hooks/` — React Query hooks wrapping Tauri commands
- `src/lib/` — utilities (`tauri.ts` for IPC wrappers, `firestore-utils.ts` for shared helpers)
- `src/stores/` — Zustand stores
- `src/types/` — TypeScript type definitions
- `src-tauri/src/` — Rust backend (commands, credentials, state, models, error)

## Development

```bash
pnpm tauri:dev     # Run the app in development mode
pnpm build         # TypeScript check + Vite build
pnpm test          # Run frontend tests (Vitest)
pnpm test:watch    # Run tests in watch mode
cargo test --manifest-path src-tauri/Cargo.toml  # Run Rust tests
```

## Testing — TDD Required

**All features MUST be developed using Test-Driven Development (TDD):**

1. Write failing tests FIRST — before any implementation code
2. Write the minimal implementation to make tests pass
3. Refactor while keeping tests green

### Frontend Testing (Vitest + React Testing Library)

- Test files go next to source files: `Component.tsx` → `Component.test.tsx`
- Use `@testing-library/react` for component tests
- Use `@testing-library/user-event` for user interaction simulation
- Mock Tauri `invoke` calls — never call real backend from frontend tests
- Test user-visible behavior, not implementation details
- Every component, hook, and utility must have tests

### Rust Testing

- Unit tests go in the same file using `#[cfg(test)]` modules
- Integration tests go in `src-tauri/tests/`
- Test pure functions (path parsing, JSON conversion, credential management) directly
- Tauri commands that need a live DB connection should be tested via integration tests or mocked

### Test Coverage Expectations

- Utility functions: 100% branch coverage
- Components: test all user interactions (click, type, submit) and edge cases (empty states, errors, loading)
- Stores: test all state transitions
- Rust commands: test path parsing, data conversion, error handling

## Code Style

- Use `@/` path alias for imports
- Components use named exports
- Prop types defined as `type ComponentNameProps = { ... }` above the component
- Rust uses `CmdResult<T>` for Tauri command return types
- Error handling: Toast notifications for user-facing errors, proper `Result` types in Rust
