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

export type EmulatorConnectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { projectId: string; emulatorUrl: string }) => Promise<void>;
  isSubmitting: boolean;
};

export function EmulatorConnectDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: EmulatorConnectDialogProps) {
  const [projectId, setProjectId] = useState('');
  const [emulatorUrl, setEmulatorUrl] = useState('http://localhost:8080');

  useEffect(() => {
    if (!open) {
      setProjectId('');
      setEmulatorUrl('http://localhost:8080');
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmedProject = projectId.trim();
    const trimmedUrl = emulatorUrl.trim();
    if (!trimmedProject || !trimmedUrl) return;
    try {
      await onSubmit({ projectId: trimmedProject, emulatorUrl: trimmedUrl });
    } catch {
      // handled upstream
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to emulator</DialogTitle>
          <DialogDescription>
            Connect to a local Firebase emulator. No service account is needed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Project ID</label>
            <Input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="my-project-id"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Emulator URL</label>
            <Input
              value={emulatorUrl}
              onChange={(e) => setEmulatorUrl(e.target.value)}
              placeholder="http://localhost:8080"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !projectId.trim() || !emulatorUrl.trim()}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
