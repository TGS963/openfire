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
      className={`flex w-full min-w-0 items-center justify-between border-b border-white/[0.04] text-sm transition-colors ${
        isSelected ? 'bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_12px_rgba(245,158,11,0.08)]' : 'hover:bg-white/[0.06]'
      }`}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(doc.path)}
        className="flex min-w-0 flex-1 flex-col items-start overflow-hidden px-4 py-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="font-medium truncate w-full block">{doc.id}</span>
        <span className="text-xs text-muted-foreground truncate w-full block">{doc.path}</span>
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
