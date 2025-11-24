# Frontend State & Data Fetching

## Libraries
- **Zustand**: For global client-state (which project is active, current UI selections).
- **TanStack Query (React Query)**: For server-state (collections, documents), caching, and loading states.

## 1. Zustand Stores

### `useAuthStore`
Manages the "session".

```typescript
type ServiceAccount = {
  id: string;
  projectId: string;
  clientEmail: string;
};

interface AuthStore {
  accounts: ServiceAccount[];
  activeAccountId: string | null;
  isLoading: boolean;
  
  loadAccounts: () => Promise<void>;
  importAccount: (filePath: string) => Promise<void>;
  setActiveAccount: (id: string) => Promise<void>;
}
```

### `useNavStore`
Manages navigation within the Firestore tree.

```typescript
interface NavStore {
  currentPath: string[]; // e.g., ['users', '123', 'posts']
  viewMode: 'table' | 'json';
  
  navigateToCollection: (collectionId: string) => void;
  navigateToDocument: (documentId: string) => void;
  goBack: () => void;
}
```

## 2. TanStack Query Hooks

### `useCollections(parentPath?: string)`
- **Key**: `['collections', activeAccountId, parentPath]`
- **Fn**: `invoke('list_collections', { parentPath })`

### `useDocuments(collectionPath: string)`
- **Key**: `['documents', activeAccountId, collectionPath, page, pageSize]`
- **Fn**: `invoke('list_documents', { collectionPath, pageSize, pageToken })`
- **Config**: `keepPreviousData: true` for smooth pagination.

## 3. Integration Strategy

1.  **Startup**:
    - App mounts -> `useEffect` triggers `useAuthStore.getState().loadAccounts()`.
    - If no accounts -> Redirect to `/onboarding` or show "Add Account" modal.
    - If active account persisted -> `setActiveAccount(id)`.

2.  **Navigation**:
    - `Sidebar` uses `useCollections(root)` to show top-level.
    - `MainView` listens to `useNavStore` to decide whether to show a Collection List or Document Detail.
    - When clicking a collection, `useDocuments` fetches data.

3.  **Mock Replacement**:
    - Remove `src/data/mock.ts`.
    - Replace hardcoded lists in `src/components/Sidebar.tsx` with `useCollections` data.
    - Replace table rows in `src/components/DataTable.tsx` with `useDocuments` data.
