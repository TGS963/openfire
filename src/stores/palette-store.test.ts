import { describe, it, expect, beforeEach } from 'vitest';

import { usePaletteStore } from '@/stores/palette-store';

beforeEach(() => {
  usePaletteStore.setState({ isOpen: false, query: '', mode: 'default' });
});

describe('usePaletteStore', () => {
  it('opens in default mode and resets query', () => {
    usePaletteStore.setState({ query: 'stale' });
    usePaletteStore.getState().open();
    expect(usePaletteStore.getState().isOpen).toBe(true);
    expect(usePaletteStore.getState().mode).toBe('default');
    expect(usePaletteStore.getState().query).toBe('');
  });

  it('opens in goto mode seeding a slash', () => {
    usePaletteStore.getState().open('goto');
    expect(usePaletteStore.getState().mode).toBe('goto');
    expect(usePaletteStore.getState().query).toBe('/');
  });

  it('opens in open-tab mode', () => {
    usePaletteStore.getState().open('open-tab');
    expect(usePaletteStore.getState().mode).toBe('open-tab');
  });

  it('closes', () => {
    usePaletteStore.getState().open();
    usePaletteStore.getState().close();
    expect(usePaletteStore.getState().isOpen).toBe(false);
  });

  it('updates the query', () => {
    usePaletteStore.getState().setQuery('users');
    expect(usePaletteStore.getState().query).toBe('users');
  });
});
