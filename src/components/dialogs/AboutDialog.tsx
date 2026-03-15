import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShineBorder } from '@/components/ui/shine-border';

export type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <ShineBorder className="mx-auto">
          <div className="p-6">
            <DialogHeader className="items-center text-center">
              <img
                src="/openfire-icon.svg"
                alt="OpenFire"
                className="mb-2 h-16 w-16 rounded-xl animate-float drop-shadow-[0_0_16px_rgba(245,158,11,0.25)]"
              />
              <DialogTitle className="text-xl">OpenFire</DialogTitle>
              <DialogDescription>Desktop Firestore Manager</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-center text-sm text-muted-foreground mt-4">
              <p>
                Browse, query, and manage your Firestore databases locally. Your credentials never leave
                this machine.
              </p>
              <Badge variant="glass" className="font-mono text-xs">
                v0.1.0
              </Badge>
              <p className="text-xs">Built with Tauri, React, and Rust.</p>
            </div>
          </div>
        </ShineBorder>
      </DialogContent>
    </Dialog>
  );
}
