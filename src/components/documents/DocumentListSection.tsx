import { useCallback, useRef } from 'react';
import { AlertCircle, FolderTree, Inbox, Loader2, SearchX } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { DocumentRow } from '@/components/documents/DocumentRow';
import { TableView } from '@/components/views/TableView';
import { useViewStore } from '@/stores/view-store';
import type { FirestoreDocument } from '@/types/firestore';

export type DocumentListSectionProps = {
  documents: FirestoreDocument[];
  isLoading: boolean;
  error?: Error;
  onRetry?: () => void;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onEditComplex?: (path: string) => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  hasCollection: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onCreateDocument: () => void;
  onDuplicateDocument: (doc: FirestoreDocument) => void;
  onDeleteDocument?: (path: string) => void;
};

export function DocumentListSection({
  documents,
  isLoading,
  error,
  onRetry,
  selectedPath,
  onSelect,
  onEditComplex,
  onEndReached,
  hasMore,
  isFetchingMore,
  hasCollection,
  search,
  onSearchChange,
  onCreateDocument,
  onDuplicateDocument,
  onDeleteDocument,
}: DocumentListSectionProps) {
  const listMode = useViewStore((state) => state.listMode);

  // Virtuoso can fire endReached multiple times within a single tick before
  // isFetchingMore flips. Guard with a ref so we only enqueue one fetch per
  // boundary crossing; the ref clears once the fetched page arrives.
  const fetchLockRef = useRef(false);
  if (!isFetchingMore) fetchLockRef.current = false;
  const handleEndReached = useCallback(() => {
    if (!hasMore || isFetchingMore || fetchLockRef.current) return;
    fetchLockRef.current = true;
    onEndReached?.();
  }, [hasMore, isFetchingMore, onEndReached]);

  if (!hasCollection) {
    return (
      <EmptyState
        icon={FolderTree}
        title="No collection selected"
        description="Pick a collection from the sidebar to browse its documents."
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        tone="destructive"
        title="Couldn't load documents"
        description={error.message}
        action={
          onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      />
    );
  }

  return (
    <section className="flex flex-1 flex-col min-h-0">
      <div className="flex items-center gap-2 border-b border-border-soft px-2.5 py-[7px]">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border-soft bg-surface px-2">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Filter ids…"
            className="h-7 border-none bg-transparent p-0 text-[12px] focus-visible:ring-0"
          />
        </div>
        <Button size="sm" onClick={onCreateDocument} disabled={!hasCollection}>
          New
        </Button>
      </div>
      <div className="relative flex-1 min-h-0">
        {isLoading && !documents.length ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading documents…</span>
          </div>
        ) : !documents.length ? (
          search.trim() ? (
            <EmptyState
              icon={SearchX}
              title="No matches"
              description={
                <>
                  No document IDs match <span className="font-mono">"{search}"</span>. Clear the
                  filter or try a different value.
                </>
              }
              action={
                <Button size="sm" variant="outline" onClick={() => onSearchChange('')}>
                  Clear filter
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No documents in this collection"
              description="Create the first document to get started."
              action={
                <Button size="sm" onClick={onCreateDocument}>
                  New document
                </Button>
              }
            />
          )
        ) : listMode === 'table' ? (
          <TableView
            documents={documents}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onEditComplex={onEditComplex}
            onEndReached={handleEndReached}
            hasMore={hasMore}
            isFetchingMore={isFetchingMore}
          />
        ) : (
          <Virtuoso
            data={documents}
            defaultItemHeight={64}
            style={{ height: '100%', scrollbarGutter: 'stable' }}
            endReached={handleEndReached}
            components={
              isFetchingMore || hasMore
                ? {
                    Footer: () => (
                      <div className="flex items-center justify-center px-3 py-2 text-[11px] text-text-muted">
                        {isFetchingMore ? 'Loading more…' : 'Scroll for more'}
                      </div>
                    ),
                  }
                : undefined
            }
            itemContent={(_, doc) => (
              <DocumentRow
                doc={doc}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onDuplicate={onDuplicateDocument}
                onDelete={onDeleteDocument}
              />
            )}
          />
        )}
        {isLoading && documents.length > 0 && (
          <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-surface/90 px-2 py-1 text-[11px] text-text-muted shadow-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Refreshing…</span>
          </div>
        )}
      </div>
    </section>
  );
}
