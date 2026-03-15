import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ConnectionEntry } from '@/types/firestore';

export type ConnectionManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: ConnectionEntry[];
  onSwitch: (id: string) => void;
  onRemove: (id: string) => void;
};

export function ConnectionManagerDialog({
  open,
  onOpenChange,
  connections,
  onSwitch,
  onRemove,
}: ConnectionManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Connections</DialogTitle>
          <DialogDescription>Switch between or remove Firebase connections.</DialogDescription>
        </DialogHeader>
        {connections.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No connections. Import a service account or connect to an emulator.
          </p>
        ) : (
          <div className="space-y-2">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{conn.id}</span>
                  <Badge variant={conn.mode.type === 'emulator' ? 'secondary' : 'default'}>
                    {conn.mode.type === 'emulator' ? 'Emulator' : 'Production'}
                  </Badge>
                  {conn.isActive && (
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!conn.isActive && (
                    <Button variant="outline" size="sm" onClick={() => onSwitch(conn.id)}>
                      Switch
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onRemove(conn.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
