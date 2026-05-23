import { useCallback, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentRow } from '@/components/documents/DocumentRow';
import { TableView } from '@/components/views/TableView';
import { useViewStore } from '@/stores/view-store';
import type { FirestoreDocument } from '@/types/firestore';

export type DocumentListSectionProps = {
  documents: FirestoreDocument[];
  isLoading: boolean;
  error?: Error;
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
  if (!hasCollection) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Choose a collection to load documents.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-destructive">
        {error.message}
      </div>
    );
  }

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
      <div className="flex-1 min-h-0">
        {isLoading && !documents.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading documents…
          </div>
        ) : !documents.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No documents found.
          </div>
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
      </div>
    </section>
  );
}
