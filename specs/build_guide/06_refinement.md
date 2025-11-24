# Step 6: Refinement & Polish

## 6.1. Theming (Dark Mode)
Shadcn/UI supports dark mode out of the box using `next-themes` (or a simple context for Vite).

**`src/components/theme-provider.tsx`**:
- Wrap the app.
- Add a toggle in the sidebar bottom.

```tsx
// Simple toggle
const { theme, setTheme } = useTheme();
<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  Toggle Theme
</Button>
```

## 6.2. Error Boundaries & Toast Notifications
- Wrap the MainLayout in an `ErrorBoundary`.
- Ensure `sonner` or `react-hot-toast` (or Shadcn's `toast`) is placed at the root.
- Create a custom hook `useNotify` to standardize success/error messages.

## 6.3. Build & Packaging
Configure the build for distribution.

**`tauri.conf.json`**:
- Update icons in `src-tauri/icons`.
- Configure the bundle identifier: `com.yourname.firefoo-alt`.

**CI/CD (GitHub Actions)**:
- Use `tauri-apps/tauri-action` to build for Mac, Windows, and Linux automatically on push to main.

## 6.4. Performance Profiling
- **Rust**: Use `tracing` and `tracing-subscriber` to log execution time of Firestore queries.
- **React**: Use React DevTools Profiler to ensure the virtualized list isn't re-rendering unnecessarily.

## 6.5. Next Steps (Phase 2)
Once this MVP is stable:
1.  **Import/Export**: Implement the streaming JSON export in Rust.
2.  **SQL Querying**: Start researching a SQL parser (like `sqlparser-rs`) to translate SQL to Firestore queries.
