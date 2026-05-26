import { Copy, Github } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const REPO_URL = 'https://github.com/TGS963/openfire';

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const { toast } = useToast();
  const copyRepoUrl = async () => {
    try {
      await navigator.clipboard.writeText(REPO_URL);
      toast({ title: 'Copied repo URL', description: REPO_URL });
    } catch {
      // ignore
    }
  };
  const openRepo = async () => {
    try {
      await invoke('open_external', { url: REPO_URL });
    } catch (e) {
      toast({ title: 'Failed to open browser', description: String(e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="p-6">
          <DialogHeader className="items-center text-center">
            <img
              src="/openfire-icon.png"
              alt="OpenFire"
              className="mb-2 h-16 w-16 rounded-xl"
            />
            <DialogTitle className="text-xl">OpenFire</DialogTitle>
            <DialogDescription>Desktop Firestore Manager</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-center text-sm text-muted-foreground mt-4">
            <p>
              Browse, query, and manage your Firestore databases locally. Your credentials never leave
              this machine.
            </p>
            <Badge variant="outline" className="font-mono text-xs">
              v{__APP_VERSION__}
            </Badge>
            <p className="text-xs">Built with Tauri, React, and Rust.</p>
            <div className="inline-flex items-stretch overflow-hidden rounded-md border border-border-soft text-xs text-text">
              <button
                type="button"
                onClick={openRepo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 hover:bg-surface-2"
                aria-label="Open OpenFire on GitHub in browser"
              >
                <Github className="h-3.5 w-3.5" />
                <span className="font-mono">github.com/TGS963/openfire</span>
              </button>
              <button
                type="button"
                onClick={copyRepoUrl}
                className="inline-flex items-center border-l border-border-soft px-2 hover:bg-surface-2"
                aria-label="Copy repo URL"
                title="Copy URL"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
