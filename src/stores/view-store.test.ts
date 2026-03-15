import { describe, it, expect, beforeEach } from 'vitest';

import { useViewStore } from '@/stores/view-store';

describe('view-store', () => {
  beforeEach(() => {
    useViewStore.setState({ listMode: 'list', previewMode: 'json', theme: 'dark' });
  });

  it('defaults to list mode', () => {
    expect(useViewStore.getState().listMode).toBe('list');
  });

  it('switches to table list mode', () => {
    useViewStore.getState().setListMode('table');
    expect(useViewStore.getState().listMode).toBe('table');
  });

  it('switches back to list mode', () => {
    useViewStore.getState().setListMode('table');
    useViewStore.getState().setListMode('list');
    expect(useViewStore.getState().listMode).toBe('list');
  });

  it('defaults to json preview mode', () => {
    expect(useViewStore.getState().previewMode).toBe('json');
  });

  it('switches to fields preview mode', () => {
    useViewStore.getState().setPreviewMode('fields');
    expect(useViewStore.getState().previewMode).toBe('fields');
  });

  it('list and preview modes are independent', () => {
    useViewStore.getState().setListMode('table');
    useViewStore.getState().setPreviewMode('fields');
    expect(useViewStore.getState().listMode).toBe('table');
    expect(useViewStore.getState().previewMode).toBe('fields');
  });

  it('defaults to dark theme', () => {
    expect(useViewStore.getState().theme).toBe('dark');
  });

  it('toggles theme from dark to light', () => {
    useViewStore.getState().toggleTheme();
    expect(useViewStore.getState().theme).toBe('light');
  });

  it('toggles theme back to dark', () => {
    useViewStore.getState().toggleTheme();
    useViewStore.getState().toggleTheme();
    expect(useViewStore.getState().theme).toBe('dark');
  });
});
