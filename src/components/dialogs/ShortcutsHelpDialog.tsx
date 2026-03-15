import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SHORTCUTS, formatShortcut } from '@/lib/keyboard-shortcuts';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

type ShortcutsHelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShortcutsHelpDialog({ open, onOpenChange }: ShortcutsHelpDialogProps) {
  const grouped = SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) acc[shortcut.category] = [];
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, typeof SHORTCUTS>,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
              <div className="space-y-1">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                      {formatShortcut(shortcut, isMac)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
