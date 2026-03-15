import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  mode: 'document' | 'collection';
  targetPath: string;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  mode,
  targetPath,
}: DeleteConfirmDialogProps) {
  const [confirmInput, setConfirmInput] = useState('');

  const collectionName = targetPath.split('/').filter(Boolean).pop() ?? '';
  const requiresConfirmation = mode === 'collection';
  const isConfirmed = !requiresConfirmation || confirmInput === collectionName;

  useEffect(() => {
    if (!open) {
      setConfirmInput('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {mode}</DialogTitle>
          <DialogDescription>
            {mode === 'document' ? (
              <>
                Are you sure you want to delete <strong>{targetPath}</strong>? This action cannot
                be undone.
              </>
            ) : (
              <>
                This will permanently delete all documents in <strong>{targetPath}</strong>. This
                action cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {requiresConfirmation && (
          <div>
            <label className="text-sm text-muted-foreground">
              Type the collection name to confirm
            </label>
            <Input
              value={confirmInput}
              onChange={(event) => setConfirmInput(event.target.value)}
              placeholder={`Type "${collectionName}" to confirm`}
            />
          </div>
        )}
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting || !isConfirmed}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
