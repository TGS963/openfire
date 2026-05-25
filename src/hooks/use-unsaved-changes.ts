import { useCellEditsStore } from '@/stores/cell-edits-store';
import { useDocDraftsStore } from '@/stores/doc-drafts-store';

/**
 * Unified view over the two unsaved-edit stores — staged table cell edits
 * (`cell-edits-store`) and whole-document preview drafts (`doc-drafts-store`).
 * The stores stay separate because a single document can carry both kinds at
 * once; this façade just sums and discards across them for the UI.
 */
export function useUnsavedCount(): number {
  const cell = useCellEditsStore((s) =>
    Object.values(s.pending).reduce((n, d) => n + Object.keys(d).length, 0),
  );
  const drafts = useDocDraftsStore((s) => Object.keys(s.drafts).length);
  return cell + drafts;
}

/** Clears both stores. Returns how many edits were discarded. */
export function discardAllUnsaved(): number {
  const total =
    useCellEditsStore.getState().pendingCount() + useDocDraftsStore.getState().count();
  useCellEditsStore.getState().clearAll();
  useDocDraftsStore.getState().clearAll();
  return total;
}
