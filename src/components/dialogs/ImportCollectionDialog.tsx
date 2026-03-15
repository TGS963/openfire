import { Loader2, FileUp } from 'lucide-react';
import { useState } from 'react';

import { openFileDialog } from '@/lib/dialog-utils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ImportMode } from '@/types/firestore';

export type ImportCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionPath: string | null;
  onSubmit: (input: { filePath: string; mode: ImportMode }) => Promise<void>;
  isSubmitting: boolean;
};

export function ImportCollectionDialog({
  open,
  onOpenChange,
  collectionPath,
  onSubmit,
  isSubmitting,
}: ImportCollectionDialogProps) {
  const [filePath, setFilePath] = useState('');
  const [mode, setMode] = useState<ImportMode>('create_only');

  const handleChooseFile = async () => {
    const file = await openFileDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      multiple: false,
    });
    if (file) {
      setFilePath(file);
    }
  };

  const handleSubmit = async () => {
    if (!filePath) return;
    try {
      await onSubmit({ filePath, mode });
    } catch {
      // handled upstream
    }
  };

  const fileName = filePath ? filePath.split('/').pop() ?? filePath : '';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setFilePath('');
          setMode('create_only');
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import collection</DialogTitle>
          <DialogDescription>
            Import documents from a JSON file into{' '}
            {collectionPath ?? 'the selected collection'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">JSON file</label>
            <div className="mt-1 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleChooseFile} disabled={isSubmitting}>
                <FileUp className="mr-1 h-3.5 w-3.5" />
                Choose file
              </Button>
              {fileName && (
                <span className="truncate text-sm text-muted-foreground">{fileName}</span>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Import mode</label>
            <div className="mt-1 space-y-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="importMode"
                  value="create_only"
                  checked={mode === 'create_only'}
                  onChange={() => setMode('create_only')}
                />
                Create only — skip existing documents
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="importMode"
                  value="overwrite"
                  checked={mode === 'overwrite'}
                  onChange={() => setMode('overwrite')}
                />
                Overwrite — replace existing documents
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !filePath}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
