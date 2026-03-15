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

  return (
    <section className="flex flex-1 flex-col min-h-0">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg dark:bg-white/5 bg-white/60 border dark:border-white/10 border-black/[0.08] backdrop-blur-sm px-3">
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Filter by document ID"
            className="border-none p-0 focus-visible:ring-0"
          />
        </div>
        <Button size="sm" onClick={onCreateDocument} disabled={!hasCollection}>
          New
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading && !documents.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading documents…
          </div>
        ) : !documents.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No documents found.
          </div>
        ) : listMode === 'table' ? (
          <TableView documents={documents} selectedPath={selectedPath} onSelect={onSelect} />
        ) : (
          <Virtuoso
            data={documents}
            style={{ height: '100%' }}
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
