import { setValueAtPath } from '@/lib/field-types';
import { useCellEditsStore } from '@/stores/cell-edits-store';
import type { FirestoreDocument } from '@/types/firestore';

export type CellFlushSave = (
  path: string,
  data: Record<string, unknown>,
) => Promise<unknown>;

/**
 * Persist all pending cell edits, one save per document.
 *
 * - Iterates over the *unfiltered* documents list passed in so edits to docs
 *   hidden by the active search filter still get saved.
 * - Clears each doc's pending only on a successful save — a failure keeps that
 *   doc's edits for retry.
 * - Skips pending entries for docs not present in `documents` (e.g. deleted).
 */
export type CellFlushResult = {
  saved: number;
  failures: { path: string; fields: string[] }[];
};

export async function flushTablePending(
  documents: FirestoreDocument[],
  save: CellFlushSave,
): Promise<CellFlushResult> {
  const entries = Object.entries(useCellEditsStore.getState().pending);
  const result: CellFlushResult = { saved: 0, failures: [] };
  for (const [path, edits] of entries) {
    const doc = documents.find((d) => d.path === path);
    if (!doc) continue;
    let merged: Record<string, unknown> = { ...doc.data };
    for (const [key, value] of Object.entries(edits)) {
      merged = setValueAtPath(merged, [key], value);
    }
    try {
      await save(path, merged);
      useCellEditsStore.getState().clearDoc(path);
      result.saved += 1;
    } catch {
      // keep this doc's pending edits so the user can retry
      result.failures.push({ path, fields: Object.keys(edits) });
    }
  }
  return result;
}
