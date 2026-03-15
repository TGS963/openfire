import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

function fireKeydown(
  key: string,
  opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {},
  target?: EventTarget,
) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, ...opts });
  if (target) {
    Object.defineProperty(event, 'target', { value: target });
  }
  document.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fires handler on matching shortcut', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'save-document': handler }));

    fireKeydown('s', { ctrlKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not fire handler for non-matching key', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'save-document': handler }));

    fireKeydown('d', { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire handler for unregistered shortcut', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'save-document': handler }));

    fireKeydown('q', { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('skips shortcut when focus is in input', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'toggle-query': handler }));

    const input = document.createElement('input');
    fireKeydown('q', { ctrlKey: true }, input);
    expect(handler).not.toHaveBeenCalled();
  });

  it('allows save-document even when focus is in input', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'save-document': handler }));

    const input = document.createElement('input');
    fireKeydown('s', { ctrlKey: true }, input);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('allows Escape even when focus is in input', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ escape: handler }));

    const input = document.createElement('input');
    fireKeydown('Escape', {}, input);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('fires run-query on Ctrl+Enter', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ 'run-query': handler }));

    fireKeydown('Enter', { ctrlKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('cleans up listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ 'save-document': handler }));

    unmount();
    fireKeydown('s', { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });
});
