import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ConnectionEntry } from '@/types/firestore';

export type TransferParams = {
  sourceConnectionId: string;
  destConnectionId: string;
  sourceCollectionPath: string;
  destCollectionPath: string;
  overwrite: boolean;
};

export type TransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: ConnectionEntry[];
  sourceConnectionId: string;
  sourceCollectionPath: string;
  onTransfer: (params: TransferParams) => void;
  isTransferring: boolean;
};

export function TransferDialog({
  open,
  onOpenChange,
  connections,
  sourceConnectionId,
  sourceCollectionPath,
  onTransfer,
  isTransferring,
}: TransferDialogProps) {
  const [destConnectionId, setDestConnectionId] = useState('');
  const [destCollectionPath, setDestCollectionPath] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  const destOptions = connections.filter((c) => c.id !== sourceConnectionId);
  const canTransfer = destConnectionId && destCollectionPath.trim() && !isTransferring;

  const handleSubmit = () => {
    if (!canTransfer) return;
    onTransfer({
      sourceConnectionId,
      destConnectionId,
      sourceCollectionPath,
      destCollectionPath: destCollectionPath.trim(),
      overwrite,
    });
  };

  if (connections.length < 2) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Collection</DialogTitle>
            <DialogDescription>Transfer documents between Firebase projects.</DialogDescription>
          </DialogHeader>
          <p className="py-4 text-center text-sm text-muted-foreground">
            You need at least two connections to transfer documents. Import another service account or connect to an emulator.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Collection</DialogTitle>
          <DialogDescription>Transfer documents between Firebase projects.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Source</label>
            <div className="mt-1 rounded-md border bg-muted/50 p-2 text-sm">
              <span className="font-medium">{sourceConnectionId}</span>
              {' / '}
              <span>{sourceCollectionPath}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="dest-connection">
              Destination Connection
            </label>
            <select
              id="dest-connection"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={destConnectionId}
              onChange={(e) => setDestConnectionId(e.target.value)}
            >
              <option value="">Select connection...</option>
              {destOptions.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="dest-collection">
              Destination Collection Path
            </label>
            <Input
              id="dest-collection"
              className="mt-1"
              placeholder="Destination collection path"
              value={destCollectionPath}
              onChange={(e) => setDestCollectionPath(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
            />
            Overwrite existing documents
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canTransfer}>
            {isTransferring ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
