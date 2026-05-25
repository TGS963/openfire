import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useCellEditsStore } from '@/stores/cell-edits-store';
import { useDocDraftsStore } from '@/stores/doc-drafts-store';
import { useUnsavedCount, discardAllUnsaved } from '@/hooks/use-unsaved-changes';

beforeEach(() => {
  useCellEditsStore.setState({ pending: {} });
  useDocDraftsStore.setState({ drafts: {} });
});

describe('useUnsavedCount', () => {
  it('sums cell edits and document drafts', () => {
    useCellEditsStore.getState().setPending('users/a', 'name', 'Bob');
    useCellEditsStore.getState().setPending('users/a', 'age', 40);
    useDocDraftsStore.getState().setDraft('users/b', { editorValue: '{}', fieldsData: {} });
    const { result } = renderHook(() => useUnsavedCount());
    expect(result.current).toBe(3);
  });

  it('is zero when both stores are empty', () => {
    const { result } = renderHook(() => useUnsavedCount());
    expect(result.current).toBe(0);
  });
});

describe('discardAllUnsaved', () => {
  it('clears both stores and returns the total discarded', () => {
    useCellEditsStore.getState().setPending('users/a', 'name', 'Bob');
    useDocDraftsStore.getState().setDraft('users/b', { editorValue: '{}', fieldsData: {} });
    expect(discardAllUnsaved()).toBe(2);
    expect(useCellEditsStore.getState().pendingCount()).toBe(0);
    expect(useDocDraftsStore.getState().count()).toBe(0);
  });
});
