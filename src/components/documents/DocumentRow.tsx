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
      role="button"
      tabIndex={0}
      className={`flex cursor-pointer items-center justify-between border-b border-white/[0.04] px-4 py-3 text-sm transition-all duration-200 ${
        isSelected ? 'bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_12px_rgba(245,158,11,0.08)]' : 'hover:bg-white/[0.06] hover:-translate-y-[0.5px]'
      }`}
      onClick={() => onSelect(doc.path)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(doc.path); }}
    >
      <div className="flex flex-1 flex-col text-left">
        <span className="font-medium">{doc.id}</span>
        <span className="text-xs text-muted-foreground truncate">{doc.path}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
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
