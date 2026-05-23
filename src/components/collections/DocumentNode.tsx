import { ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';

import { CollectionTree } from '@/components/collections/CollectionTree';

export type DocumentNodeProps = {
  documentId: string;
  documentPath: string;
  selectedDocumentPath?: string | null;
  collectionPath: string | null;
  onSelectCollection: (path: string, opts?: { background?: boolean }) => void;
  onSelectDocument?: (path: string, opts?: { background?: boolean }) => void;
};

export function DocumentNode({
  documentId,
  documentPath,
  selectedDocumentPath,
  collectionPath,
  onSelectCollection,
  onSelectDocument,
}: DocumentNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const isActive = documentPath === selectedDocumentPath;

  return (
    <div>
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
          type="button"
          onClick={(e) => onSelectDocument?.(documentPath, { background: e.metaKey || e.ctrlKey })}
          aria-pressed={isActive}
          className={`flex flex-1 items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition-colors ${
            isActive
              ? 'bg-surface-3 font-medium text-text'
              : 'text-text-muted hover:bg-surface-2'
          }`}
        >
          <FileText className="h-3 w-3 shrink-0" />
          <span className="truncate">{documentId}</span>
        </button>
      </div>
      {expanded && (
        <div className="ml-4 mt-0.5">
          <CollectionTree
            parentDocumentPath={documentPath}
            collectionPath={collectionPath}
            documentPath={selectedDocumentPath}
            onSelectCollection={onSelectCollection}
            onSelectDocument={onSelectDocument}
          />
        </div>
      )}
    </div>
  );
}
