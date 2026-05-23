import { Moon, Sun } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CollectionTree } from '@/components/collections/CollectionTree';
import { useViewStore } from '@/stores/view-store';
import type { ServiceAccountSummary } from '@/types/firestore';

export type SidebarProps = {
  accounts: ServiceAccountSummary[];
  activeAccountId: string | null;
  isLoading: boolean;
  onImport: () => Promise<void>;
  onSelectAccount: (id: string) => Promise<void>;
  collectionPath: string | null;
  documentPath: string | null;
  onSelectCollection: (path: string) => void;
  onSelectDocument?: (path: string) => void;
  connectionMode: 'production' | 'emulator' | null;
  emulatorProjectId: string | null;
  onConnectEmulator: () => void;
  onDisconnectEmulator: () => void;
  connectionCount?: number;
  onManageConnections?: () => void;
  onDeleteCollection?: (path: string) => void;
  onAbout?: () => void;
};

export function Sidebar({
  accounts,
  activeAccountId,
  isLoading,
  onImport,
  onSelectAccount,
  collectionPath,
  documentPath,
  onSelectCollection,
  onSelectDocument,
  connectionMode,
  emulatorProjectId,
  onConnectEmulator,
  onDisconnectEmulator,
  connectionCount = 0,
  onManageConnections,
  onDeleteCollection,
  onAbout,
}: SidebarProps) {
  const theme = useViewStore((s) => s.theme);
  const toggleTheme = useViewStore((s) => s.toggleTheme);
  return (
    <aside className="flex h-full flex-col dark:bg-white/[0.008] bg-white/50 backdrop-blur-xl relative bg-noise">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
        <img src="/openfire-icon.svg" alt="OpenFire" className="h-7 w-7 rounded-md" />
        <span className="text-sm font-semibold">OpenFire</span>
      </div>
      <div className="space-y-3 border-b border-white/[0.06] px-4 py-4">
        {connectionMode === 'emulator' ? (
          <div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-amber-500 text-amber-500">
                Emulator
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={onDisconnectEmulator}
              >
                Disconnect
              </Button>
            </div>
            <p className="mt-1 text-sm font-medium">{emulatorProjectId}</p>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase text-muted-foreground">Active project</p>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={activeAccountId ?? ''}
              onChange={(event) => onSelectAccount(event.target.value)}
              disabled={!accounts.length || isLoading}
            >
              {!accounts.length && <option value="">No accounts yet</option>}
              {accounts.map((account) => {
                const projectCount = accounts.filter(
                  (a) => a.projectId === account.projectId,
                ).length;
                const label =
                  projectCount > 1
                    ? `${account.projectId} (${account.clientEmail.split('@')[0]})`
                    : account.projectId;
                return (
                  <option key={account.id} value={account.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        )}
        {connectionMode !== 'emulator' && (
          <>
            <Button onClick={onImport} variant="outline" size="sm" className="w-full">
              Import service account
            </Button>
            <Button onClick={onConnectEmulator} variant="outline" size="sm" className="w-full">
              Connect emulator
            </Button>
          </>
        )}
        {connectionCount >= 2 && onManageConnections && (
          <Button onClick={onManageConnections} variant="ghost" size="sm" className="w-full">
            Manage connections ({connectionCount})
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="px-4 py-4">
          <p className="mb-2 text-xs uppercase text-muted-foreground">Collections</p>
          <CollectionTree
            collectionPath={collectionPath}
            documentPath={documentPath}
            onSelectCollection={onSelectCollection}
            onSelectDocument={onSelectDocument}
            onDeleteCollection={onDeleteCollection}
          />
        </div>
      </ScrollArea>
      <div className="border-t px-4 py-3 space-y-1.5">
        <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="mr-2 h-3.5 w-3.5" />
          ) : (
            <Moon className="mr-2 h-3.5 w-3.5" />
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
        {onAbout && (
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={onAbout}>
            About OpenFire
          </Button>
        )}
      </div>
    </aside>
  );
}
