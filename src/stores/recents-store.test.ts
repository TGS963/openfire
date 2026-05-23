import { describe, it, expect, beforeEach } from 'vitest';

import { useRecentsStore } from '@/stores/recents-store';

beforeEach(() => {
  useRecentsStore.setState({ recent: [] });
});

describe('useRecentsStore', () => {
  it('pushes a path to the front', () => {
    useRecentsStore.getState().pushRecent('users/a');
    useRecentsStore.getState().pushRecent('users/b');
    expect(useRecentsStore.getState().recent).toEqual(['users/b', 'users/a']);
  });

  it('dedupes, moving an existing path to the front', () => {
    const s = useRecentsStore.getState();
    s.pushRecent('users/a');
    s.pushRecent('users/b');
    s.pushRecent('users/a');
    expect(useRecentsStore.getState().recent).toEqual(['users/a', 'users/b']);
  });

  it('caps the list at 15 entries', () => {
    const s = useRecentsStore.getState();
    for (let i = 0; i < 20; i++) s.pushRecent(`users/${i}`);
    expect(useRecentsStore.getState().recent).toHaveLength(15);
    expect(useRecentsStore.getState().recent[0]).toBe('users/19');
  });

  it('clears the list', () => {
    useRecentsStore.getState().pushRecent('users/a');
    useRecentsStore.getState().clear();
    expect(useRecentsStore.getState().recent).toEqual([]);
  });
});
