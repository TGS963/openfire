import { ChevronRight, Folder } from 'lucide-react';
import { useState } from 'react';

import { DocumentNode } from '@/components/collections/DocumentNode';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useDocumentsInfinite } from '@/hooks/firestore';

export type CollectionTreeItemProps = {
  collectionId: string;
  fullPath: string;
  isActive: boolean;
  onSelect: (e: React.MouseEvent) => void;
  collectionPath: string | null;
  documentPath?: string | null;
  onSelectCollection: (path: string, opts?: { background?: boolean }) => void;
  onSelectDocument?: (path: string, opts?: { background?: boolean }) => void;
  onDeleteCollection?: (path: string) => void;
};

export function CollectionTreeItem({
  collectionId,
  fullPath,
  isActive,
  onSelect,
  collectionPath,
  documentPath,
  onSelectCollection,
  onSelectDocument,
  onDeleteCollection,
}: CollectionTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const documentsQuery = useDocumentsInfinite(expanded ? fullPath : null);
  const documents = documentsQuery.data?.pages.flatMap((p) => p.documents) ?? [];

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex items-center">
            <button
              className="flex h-6 w-6 items-center justify-center rounded-sm hover:bg-surface-2"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight
                className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              />
            </button>
            <button
              className={`flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-all duration-200 ${
                isActive ? 'bg-ember-bg text-ember-strong' : 'hover:bg-surface-2'
              }`}
              onClick={onSelect}
            >
              <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {collectionId}
            </button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => navigator.clipboard.writeText(fullPath)}>
            Copy path
          </ContextMenuItem>
          {onDeleteCollection && (
            <ContextMenuItem
              className="text-destructive"
              onSelect={() => onDeleteCollection(fullPath)}
            >
              Delete collection
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
      {expanded && (
        <div className="ml-4 mt-0.5">
          {documentsQuery.isLoading ? (
            <p className="py-1 text-xs text-muted-foreground">Loading documents…</p>
          ) : !documents.length ? (
            <p className="py-1 text-xs text-muted-foreground">No documents.</p>
          ) : (
            <div className="space-y-0.5">
              {documents.map((doc) => (
                <DocumentNode
                  key={doc.id}
                  documentId={doc.id}
                  documentPath={doc.path}
                  selectedDocumentPath={documentPath}
                  collectionPath={collectionPath}
                  onSelectCollection={onSelectCollection}
                  onSelectDocument={onSelectDocument}
                />
              ))}
              {documentsQuery.hasNextPage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!documentsQuery.isFetchingNextPage) {
                      void documentsQuery.fetchNextPage();
                    }
                  }}
                  disabled={documentsQuery.isFetchingNextPage}
                  className="flex h-6 w-full items-center gap-1.5 rounded-sm px-2 text-left text-[11px] text-text-muted hover:bg-surface-2 hover:text-text disabled:opacity-50"
                >
                  {documentsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
