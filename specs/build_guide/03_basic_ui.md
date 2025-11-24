# Step 3: Basic UI Implementation

## 3.1. App Layout Structure
We will use a classic "Sidebar + Main Content" layout.

**`src/components/layout/MainLayout.tsx`**:
```tsx
import { Sidebar } from "./Sidebar";
import { Outlet } from "@tanstack/react-router"; // or just children if not using router yet

export function MainLayout() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
```

## 3.2. Global State Management (Zustand)
Create a store to manage the application's UI state and connection info.

**`src/stores/useAppStore.ts`**:
```typescript
import { create } from 'zustand';

interface AppState {
  isConnected: boolean;
  currentProjectId: string | null;
  selectedCollection: string | null;
  setConnection: (projectId: string) => void;
  setSelectedCollection: (col: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isConnected: false,
  currentProjectId: null,
  selectedCollection: null,
  setConnection: (id) => set({ isConnected: true, currentProjectId: id }),
  setSelectedCollection: (col) => set({ selectedCollection: col }),
}));
```

## 3.3. Connection Dialog
Create a modal using Shadcn's `Dialog` component that accepts a Service Account JSON file.

**`src/components/features/connection/ConnectionDialog.tsx`**:
- Use `tauri-plugin-dialog` (if needed) or a simple file input to get the path.
- Call the Rust command `connect_with_service_account`.
- On success, close dialog and update Zustand store.

```tsx
import { invoke } from '@tauri-apps/api/core';

// ... inside component
const handleConnect = async (filePath: string) => {
  try {
    await invoke('connect_with_service_account', { filePath });
    toast.success("Connected!");
  } catch (e) {
    toast.error(`Failed to connect: ${e}`);
  }
};
```

## 3.4. Sidebar Component
The sidebar will list the collections once connected.

**`src/components/layout/Sidebar.tsx`**:
- Use `useQuery` to fetch `list_collections` from Rust.
- Render a loading skeleton while fetching.
- Map over collections and render buttons.

```tsx
import { useQuery } from '@tanstack/react-query';

const { data: collections } = useQuery({
  queryKey: ['collections'],
  queryFn: () => invoke<string[]>('list_collections'),
  enabled: isConnected // only fetch when connected
});
```

## 3.5. Data Table Placeholder
Create the main view where data will live.

**`src/components/features/data/CollectionTable.tsx`**:
- Initially just a blank `div` or a "Select a collection" empty state.
- Will eventually house the `react-virtuoso` table.
