import { describe, it, expect, beforeEach } from 'vitest';

import { useDocDraftsStore } from '@/stores/doc-drafts-store';

beforeEach(() => {
  useDocDraftsStore.setState({ drafts: {} });
});

describe('useDocDraftsStore', () => {
  it('stores and retrieves a draft by path', () => {
    useDocDraftsStore.getState().setDraft('users/a', { editorValue: '{}', fieldsData: { x: 1 } });
    expect(useDocDraftsStore.getState().getDraft('users/a')).toEqual({
      editorValue: '{}',
      fieldsData: { x: 1 },
    });
  });

  it('returns undefined for an unknown path', () => {
    expect(useDocDraftsStore.getState().getDraft('users/missing')).toBeUndefined();
  });

  it('keeps drafts isolated per path', () => {
    const s = useDocDraftsStore.getState();
    s.setDraft('users/a', { editorValue: 'a', fieldsData: {} });
    s.setDraft('users/b', { editorValue: 'b', fieldsData: {} });
    expect(useDocDraftsStore.getState().getDraft('users/a')?.editorValue).toBe('a');
    expect(useDocDraftsStore.getState().getDraft('users/b')?.editorValue).toBe('b');
  });

  it('clears a draft', () => {
    const s = useDocDraftsStore.getState();
    s.setDraft('users/a', { editorValue: 'a', fieldsData: {} });
    s.clearDraft('users/a');
    expect(useDocDraftsStore.getState().getDraft('users/a')).toBeUndefined();
  });

  it('clears all drafts and counts them', () => {
    const s = useDocDraftsStore.getState();
    s.setDraft('users/a', { editorValue: 'a', fieldsData: {} });
    s.setDraft('users/b', { editorValue: 'b', fieldsData: {} });
    expect(useDocDraftsStore.getState().count()).toBe(2);
    useDocDraftsStore.getState().clearAll();
    expect(useDocDraftsStore.getState().count()).toBe(0);
  });
});
