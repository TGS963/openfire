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
  onImport?: () => void;
  onConnectEmulator?: () => void;
};

export function ConnectionManagerDialog({
  open,
  onOpenChange,
  connections,
  onSwitch,
  onRemove,
  onImport,
  onConnectEmulator,
}: ConnectionManagerDialogProps) {
  // Connection ids carry the identity: emulator entries use `emu-<project_id>`
  // (mode.project_id is the source of truth) and production entries are keyed
  // by the backend as `prod-<project_id>` (commands.rs `set_active_account`).
  const labelFor = (conn: ConnectionEntry): string => {
    if (conn.mode.type === 'emulator') return conn.mode.project_id;
    return conn.id.startsWith('prod-') ? conn.id.slice('prod-'.length) : 'Unknown project';
  };
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
                  <span className="text-sm font-medium">{labelFor(conn)}</span>
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
        {(onImport || onConnectEmulator) && (
          <div className="mt-2 flex items-center justify-end gap-2 border-t border-border-soft pt-3">
            {onImport && (
              <Button variant="outline" size="sm" onClick={onImport}>
                Import service account
              </Button>
            )}
            {onConnectEmulator && (
              <Button variant="outline" size="sm" onClick={onConnectEmulator}>
                Connect emulator
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
