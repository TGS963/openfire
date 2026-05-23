import { create } from 'zustand';

type DocPending = Record<string, unknown>;

type CellEditsStore = {
  pending: Record<string, DocPending>;
  setPending: (docPath: string, key: string, value: unknown) => void;
  clearDoc: (docPath: string) => void;
  clearAll: () => void;
  getPending: (docPath: string, key: string) => { value: unknown } | undefined;
  pendingForDoc: (docPath: string) => DocPending;
  pendingCount: () => number;
};

/**
 * Staged inline cell edits awaiting a batched ⌘S persist.
 * Session-only (not persisted) — pending edits are working state.
 *
 * `getPending` returns `{ value }` so a deliberate edit to `undefined`
 * is distinguishable from "no pending edit".
 */
export const useCellEditsStore = create<CellEditsStore>((set, get) => ({
  pending: {},
  setPending: (docPath, key, value) =>
    set((s) => ({
      pending: { ...s.pending, [docPath]: { ...(s.pending[docPath] ?? {}), [key]: value } },
    })),
  clearDoc: (docPath) =>
    set((s) => {
      if (!(docPath in s.pending)) return s;
      const next = { ...s.pending };
      delete next[docPath];
      return { pending: next };
    }),
  clearAll: () => set({ pending: {} }),
  getPending: (docPath, key) => {
    const doc = get().pending[docPath];
    if (!doc || !(key in doc)) return undefined;
    return { value: doc[key] };
  },
  pendingForDoc: (docPath) => get().pending[docPath] ?? {},
  pendingCount: () =>
    Object.values(get().pending).reduce((n, doc) => n + Object.keys(doc).length, 0),
}));
