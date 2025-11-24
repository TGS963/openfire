# Step 5: Write Operations (Editing Data)

## 5.1. Document Editor Panel
When a user clicks a row, open a Sheet (Side Drawer) or a Split View.

**`src/components/features/editor/DocumentEditor.tsx`**:
- Props: `document`, `collectionId`.
- Modes: "Form View" (Inputs) vs "JSON View" (Monaco Editor).

## 5.2. JSON Editing (Monaco)
Use `@monaco-editor/react`.
- Bind the value to the formatted JSON of the document.
- On save, parse the JSON. If invalid, show error.

```tsx
<Editor 
  height="90vh" 
  defaultLanguage="json" 
  defaultValue={JSON.stringify(document, null, 2)} 
  onChange={handleEditorChange}
/>
```

## 5.3. Rust Update Command
Implement `update_document` in `commands/data.rs`.

```rust
#[tauri::command]
pub async fn update_document(
    collection: String, 
    doc_id: String, 
    data: serde_json::Value, 
    state: State<'_, AppState>
) -> Result<(), AppError> {
    // 1. Convert generic JSON back to Firestore values
    // 2. Perform update
    Ok(())
}
```

*Critical Logic*: We need a robust `json_to_firestore` converter in Rust that respects the `__type` hints we added during reading, so we don't accidentally turn a Timestamp back into a string.

## 5.4. Optimistic Updates
In React Query, when the mutation starts:
1. Cancel outgoing refetches.
2. Snapshot previous data.
3. Optimistically update the cache (update the specific document in the list).
4. If error, rollback.
5. If success, invalidate query (optional, or just keep the manual update).

```tsx
const mutation = useMutation({
  mutationFn: (newData) => invoke('update_document', { ... }),
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['documents', collection]);
    const previous = queryClient.getQueryData(['documents', collection]);
    queryClient.setQueryData(['documents', collection], (old) => {
      // update logic
    });
    return { previous };
  }
});
```

## 5.5. Delete Operation
Add a context menu (Right Click) on the table rows.
- Option: "Delete Document".
- Shows confirmation dialog ("Are you sure?").
- Calls `delete_document` command.
