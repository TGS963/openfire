# Step 4: Read Operations (Browsing Data)

## 4.1. Wiring the Data Table
We need to display the documents fetched from Rust.

**`src/components/features/data/CollectionTable.tsx`**:
- Use `useQuery` dependent on `selectedCollection`.
- Pass `limit` (e.g., 50 or 100) to start.

```tsx
const { data: documents, isLoading } = useQuery({
  queryKey: ['documents', selectedCollection],
  queryFn: () => invoke('get_documents', { collection: selectedCollection, limit: 100 }),
  enabled: !!selectedCollection
});
```

## 4.2. Virtualization
Rendering thousands of rows will lag React. We use `react-virtuoso` or `@tanstack/react-virtuoso` inside a Shadcn Table structure (or a custom div structure if the Table component is too rigid).

```tsx
import { TableVirtuoso } from 'react-virtuoso';

<TableVirtuoso
  style={{ height: '100%' }}
  data={documents}
  components={{
    Table: (props) => <table {...props} className="w-full caption-bottom text-sm" />,
    // ... map other table parts to Shadcn components
  }}
  itemContent={(index, document) => (
    <>
      <TableCell>{document.id}</TableCell>
      <TableCell>{JSON.stringify(document)}</TableCell>
    </>
  )}
/>
```

## 4.3. Handling Firestore Types
The Rust backend should return data in a format we can distinguish.
Example JSON from Rust:
```json
{
  "id": "doc_123",
  "created_at": { "__type": "timestamp", "seconds": 1600000000, "nanos": 0 },
  "location": { "__type": "geo", "lat": 40.7, "lng": -74.0 }
}
```

Create a **Cell Renderer** component (`DataCell.tsx`) that recursively renders this data:
- Strings/Numbers: Display as is.
- Timestamps: Convert to locale string.
- GeoPoints: Display "lat, lng" with a map icon.
- Maps/Arrays: Show "[Object]" or "[Array]" with a click-to-expand (or JSON view).

## 4.4. Pagination / Infinite Scroll
Modify `get_documents` in Rust to accept a `start_after` cursor (the ID or value of the last doc).

**Rust**:
```rust
pub async fn get_documents(..., start_after: Option<String>) -> ...
```

**React**:
Use `useInfiniteQuery` from TanStack Query.
- `getNextPageParam`: returns the ID of the last document in the current page.
- Wire this up to `TableVirtuoso`'s `endReached` prop to trigger loading the next page.
