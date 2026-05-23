import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
