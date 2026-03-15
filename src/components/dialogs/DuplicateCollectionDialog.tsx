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
import { useToast } from '@/components/ui/use-toast';

export type DuplicateCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceCollectionPath: string | null;
  onSubmit: (input: { targetCollectionPath: string; overwrite: boolean }) => Promise<void>;
  isSubmitting: boolean;
};

export function DuplicateCollectionDialog({
  open,
  onOpenChange,
  sourceCollectionPath,
  onSubmit,
  isSubmitting,
}: DuplicateCollectionDialogProps) {
  const { toast } = useToast();
  const [targetPath, setTargetPath] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  useEffect(() => {
    if (open && sourceCollectionPath) {
      setTargetPath(`${sourceCollectionPath}-copy`);
      setOverwrite(false);
    } else if (!open) {
      setTargetPath('');
      setOverwrite(false);
    }
  }, [open, sourceCollectionPath]);

  const handleSubmit = async () => {
    if (!sourceCollectionPath) {
      toast({
        title: 'Select a collection first',
        description: 'Choose a source collection before duplicating.',
        variant: 'destructive',
      });
      return;
    }
    const trimmed = targetPath.trim();
    if (!trimmed) {
      toast({
        title: 'Missing target name',
        description: 'Provide the destination collection path.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await onSubmit({ targetCollectionPath: trimmed, overwrite });
    } catch {
      // handled upstream
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate collection</DialogTitle>
          <DialogDescription>
            Copy documents from {sourceCollectionPath ?? 'the selected collection'} into a new or
            existing path.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Destination collection path</label>
            <Input
              value={targetPath}
              onChange={(event) => setTargetPath(event.target.value)}
              placeholder="e.g. users_copy"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(event) => setOverwrite(event.target.checked)}
            />
            Overwrite matching documents
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !sourceCollectionPath}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Duplicate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
