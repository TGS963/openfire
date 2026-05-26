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

export type CreateCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    collectionId: string;
    documentId: string;
    data: Record<string, unknown>;
  }) => Promise<void>;
  isSubmitting: boolean;
};

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateCollectionDialogProps) {
  const { toast } = useToast();
  const [collectionId, setCollectionId] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [jsonPayload, setJsonPayload] = useState('{\n  \n}');

  useEffect(() => {
    if (!open) {
      setCollectionId('');
      setDocumentId('');
      setJsonPayload('{\n  \n}');
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmedCollection = collectionId.trim();
    if (!trimmedCollection || trimmedCollection.includes('/') || trimmedCollection.startsWith('__')) {
      toast({
        title: 'Invalid collection ID',
        description: 'Provide a non-empty ID without "/" that does not start with "__".',
        variant: 'destructive',
      });
      return;
    }
    const trimmedDoc = documentId.trim();
    if (!trimmedDoc) {
      toast({
        title: 'Missing document ID',
        description: 'A collection needs at least one document to exist.',
        variant: 'destructive',
      });
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = jsonPayload.trim() ? JSON.parse(jsonPayload) : {};
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Fix the JSON before creating the collection.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await onSubmit({ collectionId: trimmedCollection, documentId: trimmedDoc, data: parsed });
    } catch {
      // errors surfaced upstream
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            A Firestore collection exists only once it holds a document — create its first one here.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label htmlFor="new-collection-id" className="text-sm text-muted-foreground">
              Collection ID
            </label>
            <Input
              id="new-collection-id"
              value={collectionId}
              onChange={(event) => setCollectionId(event.target.value)}
              placeholder="e.g. users"
            />
          </div>
          <div>
            <label htmlFor="new-collection-doc-id" className="text-sm text-muted-foreground">
              Document ID
            </label>
            <Input
              id="new-collection-doc-id"
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
              placeholder="e.g. doc-123"
            />
          </div>
          <div>
            <label
              htmlFor="new-collection-payload"
              className="mb-1 block text-sm text-muted-foreground"
            >
              JSON payload
            </label>
            <textarea
              id="new-collection-payload"
              value={jsonPayload}
              onChange={(event) => setJsonPayload(event.target.value)}
              className="min-h-[180px] w-full rounded-md border bg-background p-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} aria-label="Create">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
