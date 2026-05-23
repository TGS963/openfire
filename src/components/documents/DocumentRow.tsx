import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FirestoreDocument } from '@/types/firestore';

export type DocumentRowProps = {
  doc: FirestoreDocument;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onDuplicate: (doc: FirestoreDocument) => void;
  onDelete?: (path: string) => void;
};

export function DocumentRow({ doc, selectedPath, onSelect, onDuplicate, onDelete }: DocumentRowProps) {
  const isSelected = selectedPath === doc.path;
  return (
    <div
      className={`relative flex w-full min-w-0 items-center justify-between border-b border-border-soft transition-colors ${
        isSelected
          ? 'bg-ember-bg before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-ember before:content-[""]'
          : 'hover:bg-surface-1'
      }`}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(doc.path)}
        className="flex min-w-0 flex-1 flex-col items-start overflow-hidden px-3 py-[7px] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span
          className={`block w-full truncate font-mono text-[12px] font-medium ${
            isSelected ? 'text-ember-strong' : 'text-text'
          }`}
        >
          {doc.id}
        </span>
        <span className="block w-full truncate font-mono text-[11px] text-text-muted">
          {doc.path}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="mr-2" aria-label="Document actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(doc.path)}>
            Copy path
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(JSON.stringify(doc.data, null, 2))}>
            Copy data
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDuplicate(doc)}>Duplicate</DropdownMenuItem>
          {onDelete && (
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => onDelete(doc.path)}
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
