import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { collectionFromDocPath } from '@/lib/firestore-utils';
import { useNavStore } from '@/stores/nav-store';
import { useRecentsStore } from '@/stores/recents-store';

export type TabKind = 'collection' | 'document';

export type Tab = {
  id: string;
  kind: TabKind;
  path: string;
  collectionPath: string | null;
  documentPath: string | null;
  breadcrumbs: string[];
  dirty?: boolean;
};

type TabsStore = {
  tabs: Tab[];
  activeId: string | null;
  accountId: string | null;
  ensureAccount: (id: string) => boolean;
  openCollection: (path: string, opts?: { background?: boolean }) => void;
  openDocument: (path: string, opts?: { background?: boolean }) => void;
  closeTab: (id: string) => void;
  closeTabByPath: (path: string) => void;
  setActive: (id: string) => void;
  setDirty: (id: string, dirty: boolean) => void;
  reorder: (from: number, to: number) => void;
  syncActiveFromNav: () => void;
  hydrateNavFromActive: () => void;
  reset: () => void;
};

const newId = () => crypto.randomUUID();

function navSnapshot() {
  const { collectionPath, documentPath, breadcrumbs } = useNavStore.getState();
  return { collectionPath, documentPath, breadcrumbs };
}

function hydrateNav(tab: Tab) {
  useNavStore.setState({
    collectionPath: tab.collectionPath,
    documentPath: tab.documentPath,
    breadcrumbs: tab.breadcrumbs,
  });
}

export const useTabsStore = create<TabsStore>()(
  persist(
    (set, get) => {
      /** Write the live nav-store state into the currently active tab. */
      const snapshotActive = () => {
        const { activeId, tabs } = get();
        if (!activeId) return;
        const snap = navSnapshot();
        set({
          tabs: tabs.map((t) => (t.id === activeId ? { ...t, ...snap } : t)),
        });
      };

      const activate = (tab: Tab) => {
        set({ activeId: tab.id });
        hydrateNav(tab);
      };

      const openTab = (
        kind: TabKind,
        path: string,
        nav: Pick<Tab, 'collectionPath' | 'documentPath' | 'breadcrumbs'>,
        background?: boolean,
      ) => {
        const existing = get().tabs.find((t) => t.kind === kind && t.path === path);
        if (existing) {
          if (!background) {
            snapshotActive();
            activate(existing);
          }
          return;
        }
        const tab: Tab = { id: newId(), kind, path, ...nav };
        if (background) {
          set({ tabs: [...get().tabs, tab] });
          return;
        }
        snapshotActive();
        set({ tabs: [...get().tabs, tab] });
        activate(tab);
      };

      return {
        tabs: [],
        activeId: null,
        accountId: null,

        /** Reset tabs when the active account changes. Returns true if it reset. */
        ensureAccount: (id) => {
          if (get().accountId === id) return false;
          set({ tabs: [], activeId: null, accountId: id });
          useNavStore.getState().reset();
          return true;
        },

        openCollection: (path, opts) =>
          openTab(
            'collection',
            path,
            { collectionPath: path, documentPath: null, breadcrumbs: path.split('/') },
            opts?.background,
          ),

        openDocument: (path, opts) => {
          const collectionPath = collectionFromDocPath(path);
          useRecentsStore.getState().pushRecent(path);
          openTab(
            'document',
            path,
            {
              collectionPath,
              documentPath: path,
              breadcrumbs: collectionPath ? collectionPath.split('/') : [],
            },
            opts?.background,
          );
        },

        closeTab: (id) => {
          const { tabs, activeId } = get();
          const idx = tabs.findIndex((t) => t.id === id);
          if (idx === -1) return;
          const remaining = tabs.filter((t) => t.id !== id);
          if (id !== activeId) {
            set({ tabs: remaining });
            return;
          }
          if (remaining.length === 0) {
            set({ tabs: [], activeId: null });
            useNavStore.getState().reset();
            return;
          }
          const neighbor = remaining[Math.min(idx, remaining.length - 1)];
          set({ tabs: remaining, activeId: neighbor.id });
          hydrateNav(neighbor);
        },

        closeTabByPath: (path) => {
          const tab = get().tabs.find((t) => t.path === path);
          if (tab) get().closeTab(tab.id);
        },

        setActive: (id) => {
          if (id === get().activeId) return;
          const target = get().tabs.find((t) => t.id === id);
          if (!target) return;
          snapshotActive();
          activate(target);
        },

        setDirty: (id, dirty) => {
          const tabs = get().tabs;
          const target = tabs.find((t) => t.id === id);
          if (!target || Boolean(target.dirty) === dirty) return;
          set({ tabs: tabs.map((t) => (t.id === id ? { ...t, dirty } : t)) });
        },

        reorder: (from, to) => {
          const tabs = [...get().tabs];
          if (from < 0 || from >= tabs.length || to < 0 || to >= tabs.length) return;
          const [moved] = tabs.splice(from, 1);
          tabs.splice(to, 0, moved);
          set({ tabs });
        },

        syncActiveFromNav: () => {
          const { activeId, tabs } = get();
          if (!activeId) return;
          const snap = navSnapshot();
          const kind: TabKind = snap.documentPath ? 'document' : 'collection';
          const path = (snap.documentPath ?? snap.collectionPath) ?? '';
          set({
            tabs: tabs.map((t) => (t.id === activeId ? { ...t, ...snap, kind, path } : t)),
          });
        },

        hydrateNavFromActive: () => {
          const { activeId, tabs } = get();
          const tab = tabs.find((t) => t.id === activeId);
          if (tab) hydrateNav(tab);
        },

        reset: () => set({ tabs: [], activeId: null }),
      };
    },
    {
      name: 'tabs-store',
      partialize: (state) => ({
        tabs: state.tabs,
        activeId: state.activeId,
        accountId: state.accountId,
      }),
    },
  ),
);
