import { describe, it, expect, beforeEach } from 'vitest';

import { useCellEditsStore } from '@/stores/cell-edits-store';

beforeEach(() => {
  useCellEditsStore.setState({ pending: {} });
});

describe('useCellEditsStore', () => {
  it('stores pending edits per doc and key', () => {
    const s = useCellEditsStore.getState();
    s.setPending('users/a', 'name', 'Ada');
    s.setPending('users/a', 'age', 36);
    expect(s.pendingForDoc('users/a')).toEqual({ name: 'Ada', age: 36 });
  });

  it('distinguishes "no edit" from "edited to undefined"', () => {
    const s = useCellEditsStore.getState();
    expect(s.getPending('users/a', 'name')).toBeUndefined();
    s.setPending('users/a', 'name', undefined);
    expect(s.getPending('users/a', 'name')).toEqual({ value: undefined });
  });

  it('counts pending cells across docs', () => {
    const s = useCellEditsStore.getState();
    s.setPending('users/a', 'name', 'x');
    s.setPending('users/a', 'age', 1);
    s.setPending('users/b', 'plan', 'pro');
    expect(s.pendingCount()).toBe(3);
  });

  it('clears a single doc', () => {
    const s = useCellEditsStore.getState();
    s.setPending('users/a', 'name', 'x');
    s.setPending('users/b', 'plan', 'pro');
    s.clearDoc('users/a');
    expect(s.pendingForDoc('users/a')).toEqual({});
    expect(s.pendingCount()).toBe(1);
  });

  it('clears all', () => {
    const s = useCellEditsStore.getState();
    s.setPending('users/a', 'name', 'x');
    s.setPending('users/b', 'plan', 'pro');
    s.clearAll();
    expect(s.pendingCount()).toBe(0);
  });

  it('overwrites an existing pending edit', () => {
    const s = useCellEditsStore.getState();
    s.setPending('users/a', 'name', 'Ada');
    s.setPending('users/a', 'name', 'Ada Lovelace');
    expect(s.getPending('users/a', 'name')).toEqual({ value: 'Ada Lovelace' });
    expect(s.pendingCount()).toBe(1);
  });
});
