import { create } from 'zustand';

export type DocDraft = {
  editorValue: string;
  fieldsData: Record<string, unknown>;
};

type DocDraftsStore = {
  drafts: Record<string, DocDraft>;
  getDraft: (path: string) => DocDraft | undefined;
  setDraft: (path: string, draft: DocDraft) => void;
  clearDraft: (path: string) => void;
  clearAll: () => void;
  count: () => number;
};

/**
 * Holds unsaved edit buffers for the document preview, keyed by document path,
 * so switching tabs/documents does not discard in-progress edits. Session-only
 * (not persisted) — drafts are working state, not durable data.
 */
export const useDocDraftsStore = create<DocDraftsStore>((set, get) => ({
  drafts: {},
  getDraft: (path) => get().drafts[path],
  setDraft: (path, draft) => set((s) => ({ drafts: { ...s.drafts, [path]: draft } })),
  clearDraft: (path) =>
    set((s) => {
      if (!(path in s.drafts)) return s;
      const next = { ...s.drafts };
      delete next[path];
      return { drafts: next };
    }),
  clearAll: () => set({ drafts: {} }),
  count: () => Object.keys(get().drafts).length,
}));
