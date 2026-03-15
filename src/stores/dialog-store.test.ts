import { describe, it, expect, beforeEach } from 'vitest';

import { useDialogStore } from '@/stores/dialog-store';

describe('dialog-store', () => {
  beforeEach(() => {
    useDialogStore.setState({ stack: [] });
  });

  it('starts with no open dialogs', () => {
    expect(useDialogStore.getState().stack).toEqual([]);
    expect(useDialogStore.getState().isOpen('about')).toBe(false);
  });

  it('opens a dialog', () => {
    useDialogStore.getState().open('about');
    expect(useDialogStore.getState().isOpen('about')).toBe(true);
    expect(useDialogStore.getState().stack).toEqual(['about']);
  });

  it('does not duplicate an already open dialog', () => {
    useDialogStore.getState().open('about');
    useDialogStore.getState().open('about');
    expect(useDialogStore.getState().stack).toEqual(['about']);
  });

  it('opens multiple dialogs in stack order', () => {
    useDialogStore.getState().open('about');
    useDialogStore.getState().open('shortcutsHelp');
    expect(useDialogStore.getState().stack).toEqual(['about', 'shortcutsHelp']);
    expect(useDialogStore.getState().isOpen('about')).toBe(true);
    expect(useDialogStore.getState().isOpen('shortcutsHelp')).toBe(true);
  });

  it('closes a specific dialog', () => {
    useDialogStore.getState().open('about');
    useDialogStore.getState().open('shortcutsHelp');
    useDialogStore.getState().close('about');
    expect(useDialogStore.getState().stack).toEqual(['shortcutsHelp']);
    expect(useDialogStore.getState().isOpen('about')).toBe(false);
  });

  it('closeTop removes the most recently opened dialog', () => {
    useDialogStore.getState().open('about');
    useDialogStore.getState().open('shortcutsHelp');
    useDialogStore.getState().closeTop();
    expect(useDialogStore.getState().stack).toEqual(['about']);
  });

  it('closeTop is a no-op when no dialogs are open', () => {
    useDialogStore.getState().closeTop();
    expect(useDialogStore.getState().stack).toEqual([]);
  });

  it('close is a no-op for a dialog that is not open', () => {
    useDialogStore.getState().open('about');
    useDialogStore.getState().close('transfer');
    expect(useDialogStore.getState().stack).toEqual(['about']);
  });
});
