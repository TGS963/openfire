import { Loader2, Terminal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ListModeToggle } from '@/components/views/ViewModeToggle';

export type HeaderProps = {
  collectionPath: string | null;
  isLoading: boolean;
  canClear: boolean;
  onClearSelection: () => void;
  onDuplicateCollection: () => void;
  onDeleteCollection?: () => void;
  onExportCollection?: () => void;
  onImportCollection?: () => void;
  onTransferCollection?: () => void;
  connectionCount?: number;
  shellOpen?: boolean;
  onToggleShell?: () => void;
};

export function Header({
  collectionPath,
  isLoading,
  canClear,
  onClearSelection,
  onDuplicateCollection,
  onDeleteCollection,
  onExportCollection,
  onImportCollection,
  onTransferCollection,
  connectionCount = 0,
  shellOpen,
  onToggleShell,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/[0.06] dark:bg-white/[0.005] bg-white/30 backdrop-blur-sm px-6 py-4">
      <div>
        <p className="text-xs uppercase text-muted-foreground">Collection</p>
        <h1 className="text-2xl font-semibold">
          {collectionPath ? collectionPath : 'Select a collection'}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {collectionPath && <ListModeToggle />}
        {collectionPath && (
          <>
            {onExportCollection && (
              <Button variant="outline" size="sm" onClick={onExportCollection}>
                Export
              </Button>
            )}
            {onImportCollection && (
              <Button variant="outline" size="sm" onClick={onImportCollection}>
                Import
              </Button>
            )}
            {onTransferCollection && connectionCount >= 2 && (
              <Button variant="outline" size="sm" onClick={onTransferCollection}>
                Transfer
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onDuplicateCollection}>
              Duplicate
            </Button>
            {onDeleteCollection && (
              <Button variant="destructive" size="sm" onClick={onDeleteCollection}>
                Delete
              </Button>
            )}
          </>
        )}
        {onToggleShell && (
          <Button
            variant={shellOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleShell}
            aria-label="Toggle shell"
          >
            <Terminal className="mr-1.5 h-4 w-4" />
            Shell
          </Button>
        )}
        {canClear && (
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Fetching documents…
          </div>
        )}
      </div>
    </header>
  );
}
