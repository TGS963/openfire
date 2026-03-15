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
import { collectionFromDocPath } from '@/lib/firestore-utils';
import type { FirestoreDocument } from '@/types/firestore';

export type DuplicateDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceDocument: FirestoreDocument | null;
  onSubmit: (input: {
    targetCollectionPath: string;
    targetDocumentId: string;
    overwrite: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
};

export function DuplicateDocumentDialog({
  open,
  onOpenChange,
  sourceDocument,
  onSubmit,
  isSubmitting,
}: DuplicateDocumentDialogProps) {
  const { toast } = useToast();
  const [collectionInput, setCollectionInput] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  useEffect(() => {
    if (sourceDocument) {
      setCollectionInput(collectionFromDocPath(sourceDocument.path) || '');
      setDocumentId(`${sourceDocument.id}-copy`);
    } else {
      setCollectionInput('');
      setDocumentId('');
      setOverwrite(false);
    }
  }, [sourceDocument, open]);

  const handleSubmit = async () => {
    if (!sourceDocument) return;
    const trimmedCollection = collectionInput.trim();
    const trimmedId = documentId.trim();
    if (!trimmedCollection || !trimmedId) {
      toast({
        title: 'Missing destination',
        description: 'Provide both the collection path and document ID.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await onSubmit({
        targetCollectionPath: trimmedCollection,
        targetDocumentId: trimmedId,
        overwrite,
      });
    } catch {
      // handled upstream
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate document</DialogTitle>
          <DialogDescription>
            Copy {sourceDocument?.id ?? 'the selected document'} into another collection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Target collection path</label>
            <Input
              value={collectionInput}
              onChange={(event) => setCollectionInput(event.target.value)}
              placeholder="e.g. users/123/posts"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Document ID</label>
            <Input value={documentId} onChange={(event) => setDocumentId(event.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(event) => setOverwrite(event.target.checked)}
            />
            Overwrite if the document already exists
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !sourceDocument}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Duplicate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
