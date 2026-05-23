import { ChevronRight, Folder } from 'lucide-react';
import { useState } from 'react';

import { DocumentNode } from '@/components/collections/DocumentNode';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useDocuments } from '@/hooks/firestore';

export type CollectionTreeItemProps = {
  collectionId: string;
  fullPath: string;
  isActive: boolean;
  onSelect: () => void;
  collectionPath: string | null;
  documentPath?: string | null;
  onSelectCollection: (path: string) => void;
  onSelectDocument?: (path: string) => void;
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
  const documentsQuery = useDocuments(expanded ? fullPath : null);
  const documents = documentsQuery.data?.documents ?? [];

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex items-center">
            <button
              className="flex h-6 w-6 items-center justify-center rounded-sm hover:bg-white/10"
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
                isActive ? 'bg-primary/10 text-primary shadow-[0_0_8px_rgba(245,158,11,0.1)]' : 'hover:bg-white/[0.06]'
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
