import { Plus } from 'lucide-react';

import { useCollections } from '@/hooks/firestore';
import { CollectionTreeItem } from '@/components/collections/CollectionTreeItem';

export type CollectionTreeProps = {
  parentDocumentPath?: string | null;
  collectionPath: string | null;
  documentPath?: string | null;
  onSelectCollection: (path: string, opts?: { background?: boolean }) => void;
  onSelectDocument?: (path: string, opts?: { background?: boolean }) => void;
  onDeleteCollection?: (path: string) => void;
  onCreateCollection?: () => void;
};

export function CollectionTree({
  parentDocumentPath,
  collectionPath,
  documentPath,
  onSelectCollection,
  onSelectDocument,
  onDeleteCollection,
  onCreateCollection,
}: CollectionTreeProps) {
  const { data, isLoading } = useCollections(parentDocumentPath);
  const collections = data?.collectionIds ?? [];

  if (isLoading) {
    return <p className="px-1 py-1 text-[13px] text-text-muted">Loading collections…</p>;
  }

  if (!collections.length) {
    return (
      <div className="space-y-1.5 px-1 py-1">
        <p className="text-[13px] text-text-muted">No collections found.</p>
        {onCreateCollection && !parentDocumentPath && (
          <button
            type="button"
            onClick={onCreateCollection}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12.5px] text-ember hover:bg-surface-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Create collection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {collections.map((collectionId) => {
        const fullPath = parentDocumentPath
          ? `${parentDocumentPath}/${collectionId}`
          : collectionId;
        return (
          <CollectionTreeItem
            key={collectionId}
            collectionId={collectionId}
            fullPath={fullPath}
            isActive={collectionPath === fullPath}
            onSelect={(e) => onSelectCollection(fullPath, { background: e.metaKey || e.ctrlKey })}
            collectionPath={collectionPath}
            documentPath={documentPath}
            onSelectCollection={onSelectCollection}
            onSelectDocument={onSelectDocument}
            onDeleteCollection={onDeleteCollection}
          />
        );
      })}
    </div>
  );
}
