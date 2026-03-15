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

export type CreateDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionPath: string | null;
  onSubmit: (input: { documentId: string; data: Record<string, unknown> }) => Promise<void>;
  isSubmitting: boolean;
};

export function CreateDocumentDialog({
  open,
  onOpenChange,
  collectionPath,
  onSubmit,
  isSubmitting,
}: CreateDocumentDialogProps) {
  const { toast } = useToast();
  const [documentId, setDocumentId] = useState('');
  const [jsonPayload, setJsonPayload] = useState('{\n  \n}');

  useEffect(() => {
    if (!open) {
      setDocumentId('');
      setJsonPayload('{\n  \n}');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!collectionPath) {
      toast({
        title: 'Select a collection first',
        description: 'Choose a destination collection before creating a document.',
        variant: 'destructive',
      });
      return;
    }
    const trimmedId = documentId.trim();
    if (!trimmedId) {
      toast({
        title: 'Missing document ID',
        description: 'Provide a document ID before saving.',
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
        description: 'Fix the JSON before creating the document.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await onSubmit({ documentId: trimmedId, data: parsed });
    } catch {
      // errors surfaced upstream
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>
            Documents are saved under {collectionPath ?? 'the selected collection'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Document ID</label>
            <Input
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
              placeholder="e.g. doc-123"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">JSON payload</label>
            <textarea
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !collectionPath}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
