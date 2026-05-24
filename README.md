# OpenFire

A desktop GUI for Cloud Firestore. Browse collections, edit documents, run
queries, and move data between databases — without living in the Firebase
console or writing one-off scripts.

OpenFire is a [Tauri](https://tauri.app) app: a React frontend with a Rust
backend. Every Firestore call happens in Rust over gRPC, so your service
account key never touches the webview.

## Why

The Firebase console is fine for a quick look and painful for everything else:
no real query surface, no bulk edits, no way to copy a collection from staging
to a local emulator. OpenFire is the tool you reach for when you actually need
to *work* with the data.

## Features

- **Tree browser** for collections and documents, with lazy loading.
- **Document editor** — edit fields inline or drop into a raw JSON view.
- **Query builder** with `where` filters, ordering, and limits.
- **Bulk operations** — duplicate, delete, import, and export whole
  collections (newline-delimited JSON).
- **Multiple connections** — switch between production service accounts and a
  local Firestore emulator. Copy documents from one to another.
- **Connection health** — a status indicator that reflects whether the
  database is actually reachable, not just whether you picked an account.
- **Tabs, a command palette, and a dark/light theme**, because you'll have this
  open all day.

## Connecting

OpenFire talks to Firestore two ways:

1. **Service account** — import a service account JSON key
   (Firebase console → Project Settings → Service accounts → Generate new
   private key). The key is stored locally and used only by the Rust backend.
2. **Emulator** — point OpenFire at a running
   [Firestore emulator](https://firebase.google.com/docs/emulator-suite) by
   project ID and URL. No credentials needed.

You can keep several connections configured and switch between them from the
sidebar.

## Development

Prerequisites:

- [Node.js](https://nodejs.org) 24+ and [pnpm](https://pnpm.io)
- [Rust](https://rustup.rs) 1.77+
- The platform dependencies Tauri needs — see
  [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)
  (on Linux: `webkit2gtk`, `libappindicator`, and friends)

```bash
pnpm install
pnpm tauri:dev      # run the app with hot reload
```

Other scripts:

```bash
pnpm build          # type-check the frontend and build it
pnpm test           # frontend tests (Vitest)
pnpm test:watch     # frontend tests in watch mode
pnpm tauri:build    # build a distributable desktop binary

cargo test --manifest-path src-tauri/Cargo.toml   # Rust tests
```

This project is built test-first. New behavior comes with tests; see
[CLAUDE.md](CLAUDE.md) for the conventions.

## Project layout

```
src/              React frontend
  components/      UI, organized by feature (documents, query, dialogs, ...)
  hooks/           React Query hooks wrapping the Tauri commands
  lib/             IPC wrappers (tauri.ts) and shared helpers
  stores/          Zustand stores (auth, navigation, tabs, ...)
  types/           shared TypeScript types
src-tauri/src/    Rust backend (commands, credentials, state, models)
```

The frontend never speaks to Firestore directly — it invokes Tauri commands,
and the Rust side does the work. `src/lib/tauri.ts` is the full list of those
commands if you want a map of what the backend can do.

## Stack

React 18 · TypeScript · Vite · Tailwind · shadcn/ui · TanStack Query · Zustand
on the frontend; Rust with the `firestore` crate on the backend; Tauri v2 as
the shell.
