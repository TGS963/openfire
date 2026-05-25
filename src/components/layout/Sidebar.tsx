import { ChevronsUpDown, HelpCircle, Moon, Search, Sun } from 'lucide-react';

import { Kbd } from '@/components/ui/kbd';
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
  onSelectCollection: (path: string, opts?: { background?: boolean }) => void;
  onSelectDocument?: (path: string, opts?: { background?: boolean }) => void;
  connectionMode: 'production' | 'emulator' | null;
  connectionError?: string | null;
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
  collectionPath,
  documentPath,
  onSelectCollection,
  onSelectDocument,
  connectionMode,
  connectionError,
  emulatorProjectId,
  onManageConnections,
  onDeleteCollection,
  onAbout,
}: SidebarProps) {
  const theme = useViewStore((s) => s.theme);
  const toggleTheme = useViewStore((s) => s.toggleTheme);

  const isEmulator = connectionMode === 'emulator';
  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const projectName = isEmulator ? emulatorProjectId : (activeAccount?.projectId ?? null);
  const projectMeta = isEmulator ? 'local emulator' : (activeAccount?.clientEmail ?? null);
  const mark = (projectName ?? '?').charAt(0).toUpperCase();

  return (
    <aside className="flex h-full flex-col bg-surface-1">
      {/* project pill */}
      <div className="border-b border-border-soft px-2.5 pb-2 pt-2.5">
        <button
          type="button"
          onClick={onManageConnections}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
        >
          <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[5px] bg-ember font-mono text-[12px] font-bold text-ember-fg">
            {mark}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold text-text">
              {projectName ?? 'No project'}
            </span>
            <span className="block truncate font-mono text-[10.5px] text-text-muted">
              {projectMeta ?? 'Connect a project'}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-text-faint" />
        </button>
      </div>

      {/* search */}
      <div className="mx-2.5 mb-1 mt-2 flex items-center gap-1.5 rounded-md border border-border-soft bg-surface px-2 py-[5px] text-[12px] text-text-muted">
        <Search className="h-3.5 w-3.5 shrink-0 text-text-faint" />
        <span className="flex-1">Search…</span>
        <Kbd className="ml-auto">⌘K</Kbd>
      </div>

      {/* collections */}
      <div className="flex items-center justify-between px-2.5 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-faint">
        Collections
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-1.5 pb-2">
          <CollectionTree
            collectionPath={collectionPath}
            documentPath={documentPath}
            onSelectCollection={onSelectCollection}
            onSelectDocument={onSelectDocument}
            onDeleteCollection={onDeleteCollection}
          />
        </div>
      </ScrollArea>

      {/* footer */}
      <div className="flex h-6 flex-shrink-0 items-center gap-2 border-t border-border-soft px-2.5 text-[11.5px] text-text-muted">
        <span
          data-testid="connection-dot"
          // Health-first precedence: no active mode = disconnected; an active
          // connection with a probe/connect error = error (wins over context);
          // otherwise show the mode (emulator vs production).
          data-mode={
            connectionMode === null
              ? 'disconnected'
              : connectionError
                ? 'error'
                : connectionMode
          }
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            connectionMode === null
              ? 'bg-text-faint'
              : connectionError
                ? 'bg-danger shadow-[0_0_0_2px_oklch(0.63_0.20_25_/_0.18)]'
                : isEmulator
                  ? 'bg-warning shadow-[0_0_0_2px_oklch(0.80_0.15_80_/_0.18)]'
                  : 'bg-success shadow-[0_0_0_2px_oklch(0.74_0.13_150_/_0.18)]'
          }`}
        />
        <span className="min-w-0 flex-1 truncate">{projectName ?? 'Not connected'}</span>
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={toggleTheme}
          className="grid h-[22px] w-[22px] place-items-center rounded-sm text-text-muted hover:bg-surface-2 hover:text-text"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        {onAbout && (
          <button
            type="button"
            aria-label="About OpenFire"
            onClick={onAbout}
            className="grid h-[22px] w-[22px] place-items-center rounded-sm text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
