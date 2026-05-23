import { Github } from 'lucide-react';

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
      // ignore — anchor still navigates
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="p-6">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 grid h-16 w-16 place-items-center rounded-xl bg-ember font-mono text-[28px] font-bold tracking-[-0.04em] text-ember-fg">
              of
            </div>
            <DialogTitle className="text-xl">OpenFire</DialogTitle>
            <DialogDescription>Desktop Firestore Manager</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-center text-sm text-muted-foreground mt-4">
            <p>
              Browse, query, and manage your Firestore databases locally. Your credentials never leave
              this machine.
            </p>
            <Badge variant="outline" className="font-mono text-xs">
              v0.1.0
            </Badge>
            <p className="text-xs">Built with Tauri, React, and Rust.</p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              onClick={copyRepoUrl}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-soft px-2.5 py-1 text-xs text-text hover:bg-surface-2"
              aria-label="OpenFire on GitHub (click to copy URL)"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="font-mono">github.com/TGS963/openfire</span>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
