import { describe, it, expect, vi, beforeEach } from 'vitest';

import { flushTablePending } from '@/lib/cell-flush';
import { useCellEditsStore } from '@/stores/cell-edits-store';
import type { FirestoreDocument } from '@/types/firestore';

const docs: FirestoreDocument[] = [
  { id: 'a', path: 'users/a', data: { name: 'Ada', age: 36 } },
  { id: 'b', path: 'users/b', data: { name: 'Bob' } },
];

beforeEach(() => {
  useCellEditsStore.setState({ pending: {} });
});

describe('flushTablePending', () => {
  it('saves merged data per doc and clears pending on success', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    useCellEditsStore.getState().setPending('users/a', 'age', 37);
    useCellEditsStore.getState().setPending('users/b', 'name', 'Robert');

    const result = await flushTablePending(docs, save);

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenCalledWith('users/a', { name: 'Ada', age: 37 });
    expect(save).toHaveBeenCalledWith('users/b', { name: 'Robert' });
    expect(useCellEditsStore.getState().pendingCount()).toBe(0);
    expect(result).toEqual({ saved: 2, failures: [] });
  });

  it('keeps pending for a doc whose save fails and reports failure', async () => {
    const save = vi
      .fn<CellFlushSave>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('boom'));
    useCellEditsStore.getState().setPending('users/a', 'age', 37);
    useCellEditsStore.getState().setPending('users/b', 'name', 'Robert');

    const result = await flushTablePending(docs, save);

    expect(useCellEditsStore.getState().pendingForDoc('users/a')).toEqual({});
    expect(useCellEditsStore.getState().pendingForDoc('users/b')).toEqual({ name: 'Robert' });
    expect(result.saved).toBe(1);
    expect(result.failures).toEqual([{ path: 'users/b', fields: ['name'] }]);
  });

  it('skips pending entries for unknown doc paths', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    useCellEditsStore.getState().setPending('users/gone', 'x', 1);
    await flushTablePending(docs, save);
    expect(save).not.toHaveBeenCalled();
    expect(useCellEditsStore.getState().pendingForDoc('users/gone')).toEqual({ x: 1 });
  });
});

type CellFlushSave = (path: string, data: Record<string, unknown>) => Promise<unknown>;
