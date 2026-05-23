import { Bookmark, FileText, Folder, Terminal } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useCollections } from '@/hooks/firestore';
import { usePaletteStore } from '@/stores/palette-store';
import { useQueryStore } from '@/stores/query-store';
import { useRecentsStore } from '@/stores/recents-store';
import { useTabsStore } from '@/stores/tabs-store';
import type { SavedQuery } from '@/types/firestore';

export type PaletteAction = {
  id: string;
  label: string;
  run: () => void;
};

export type CommandPaletteProps = {
  actions: PaletteAction[];
  onLoadQuery: (query: SavedQuery) => void;
};

function docId(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function CommandPalette({ actions, onLoadQuery }: CommandPaletteProps) {
  const isOpen = usePaletteStore((s) => s.isOpen);
  const query = usePaletteStore((s) => s.query);
  const setQuery = usePaletteStore((s) => s.setQuery);
  const close = usePaletteStore((s) => s.close);

  const { data } = useCollections();
  const collections = data?.collectionIds ?? [];
  const savedQueries = useQueryStore((s) => s.queries);
  const recent = useRecentsStore((s) => s.recent);
  const openCollection = useTabsStore((s) => s.openCollection);
  const openDocument = useTabsStore((s) => s.openDocument);

  if (!isOpen) return null;

  const run = (fn: () => void) => {
    fn();
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[oklch(0.10_0.005_60_/_0.55)] pt-[12vh]"
      onClick={close}
    >
      <div
        className="w-[560px] overflow-hidden rounded-xl border border-border shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
        >
          <CommandInput
            autoFocus
            placeholder="Type a command or search…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>

            {collections.length > 0 && (
              <CommandGroup heading="Collections">
                {collections.map((id) => (
                  <CommandItem key={id} value={id} onSelect={() => run(() => openCollection(id))}>
                    <Folder className="h-4 w-4 text-text-muted" />
                    <span className="flex-1">{id}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Actions">
              {actions.map((a) => (
                <CommandItem key={a.id} value={a.label} onSelect={() => run(a.run)}>
                  <Terminal className="h-4 w-4 text-text-muted" />
                  <span className="flex-1">{a.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            {savedQueries.length > 0 && (
              <CommandGroup heading="Saved queries">
                {savedQueries.map((q) => (
                  <CommandItem
                    key={q.id}
                    value={`${q.name} ${q.collectionPath}`}
                    onSelect={() => run(() => onLoadQuery(q))}
                  >
                    <Bookmark className="h-4 w-4 text-text-muted" />
                    <span className="flex-1">{q.name}</span>
                    <span className="font-mono text-[11.5px] text-text-muted">{q.collectionPath}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {recent.length > 0 && (
              <CommandGroup heading="Recent documents">
                {recent.map((path) => (
                  <CommandItem key={path} value={path} onSelect={() => run(() => openDocument(path))}>
                    <FileText className="h-4 w-4 text-text-muted" />
                    <span className="flex-1 font-mono text-[12px]">{docId(path)}</span>
                    <span className="font-mono text-[11.5px] text-text-muted">{path}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>

          <div className="flex items-center gap-3 border-t border-border-soft px-3 py-2 text-[10.5px] text-text-muted">
            <span>↑↓ navigate</span>
            <span>⏎ select</span>
            <span>esc close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
