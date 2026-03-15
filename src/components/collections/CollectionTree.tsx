import { useCollections } from '@/hooks/firestore';
import { CollectionTreeItem } from '@/components/collections/CollectionTreeItem';

export type CollectionTreeProps = {
  parentDocumentPath?: string | null;
  collectionPath: string | null;
  documentPath?: string | null;
  onSelectCollection: (path: string) => void;
  onDeleteCollection?: (path: string) => void;
};

export function CollectionTree({
  parentDocumentPath,
  collectionPath,
  documentPath,
  onSelectCollection,
  onDeleteCollection,
}: CollectionTreeProps) {
  const { data, isLoading } = useCollections(parentDocumentPath);
  const collections = data?.collectionIds ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading collections…</p>;
  }

  if (!collections.length) {
    return <p className="text-sm text-muted-foreground">No collections found.</p>;
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
            onSelect={() => onSelectCollection(fullPath)}
            collectionPath={collectionPath}
            documentPath={documentPath}
            onSelectCollection={onSelectCollection}
            onDeleteCollection={onDeleteCollection}
          />
        );
      })}
    </div>
  );
}
