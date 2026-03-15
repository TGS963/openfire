import { describe, it, expect } from 'vitest';

import {
  SHORTCUTS,
  matchesShortcut,
  formatShortcut,
  type ShortcutDef,
} from '@/lib/keyboard-shortcuts';

function makeKeyEvent(
  key: string,
  opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, ...opts });
}

describe('matchesShortcut', () => {
  const saveShortcut: ShortcutDef = {
    id: 'save-document',
    key: 's',
    modifiers: ['mod'],
    label: 'Save',
    description: 'Save document',
    category: 'Document',
  };

  it('matches Ctrl+S on non-mac', () => {
    const event = makeKeyEvent('s', { ctrlKey: true });
    expect(matchesShortcut(event, saveShortcut, false)).toBe(true);
  });

  it('matches Cmd+S on mac', () => {
    const event = makeKeyEvent('s', { metaKey: true });
    expect(matchesShortcut(event, saveShortcut, true)).toBe(true);
  });

  it('does not match without modifier', () => {
    const event = makeKeyEvent('s');
    expect(matchesShortcut(event, saveShortcut, false)).toBe(false);
  });

  it('does not match wrong key', () => {
    const event = makeKeyEvent('d', { ctrlKey: true });
    expect(matchesShortcut(event, saveShortcut, false)).toBe(false);
  });

  it('matches shift modifier', () => {
    const shortcut: ShortcutDef = {
      id: 'test',
      key: 'k',
      modifiers: ['mod', 'shift'],
      label: 'Test',
      description: '',
      category: 'Test',
    };
    const event = makeKeyEvent('k', { ctrlKey: true, shiftKey: true });
    expect(matchesShortcut(event, shortcut, false)).toBe(true);
  });

  it('rejects when shift is pressed but not expected', () => {
    const event = makeKeyEvent('s', { ctrlKey: true, shiftKey: true });
    expect(matchesShortcut(event, saveShortcut, false)).toBe(false);
  });

  it('matches Escape without modifiers', () => {
    const shortcut: ShortcutDef = {
      id: 'escape',
      key: 'Escape',
      modifiers: [],
      label: 'Escape',
      description: 'Close',
      category: 'Navigation',
    };
    const event = makeKeyEvent('Escape');
    expect(matchesShortcut(event, shortcut, false)).toBe(true);
  });

  it('matches Enter key', () => {
    const shortcut: ShortcutDef = {
      id: 'run-query',
      key: 'Enter',
      modifiers: ['mod'],
      label: 'Run',
      description: 'Run query',
      category: 'Query',
    };
    const event = makeKeyEvent('Enter', { ctrlKey: true });
    expect(matchesShortcut(event, shortcut, false)).toBe(true);
  });
});

describe('formatShortcut', () => {
  const saveShortcut: ShortcutDef = {
    id: 'save-document',
    key: 'S',
    modifiers: ['mod'],
    label: 'Save',
    description: 'Save document',
    category: 'Document',
  };

  it('formats with Cmd on mac', () => {
    expect(formatShortcut(saveShortcut, true)).toBe('⌘S');
  });

  it('formats with Ctrl on non-mac', () => {
    expect(formatShortcut(saveShortcut, false)).toBe('Ctrl+S');
  });

  it('formats with shift modifier', () => {
    const shortcut: ShortcutDef = {
      id: 'test',
      key: 'K',
      modifiers: ['mod', 'shift'],
      label: 'Test',
      description: '',
      category: 'Test',
    };
    expect(formatShortcut(shortcut, true)).toBe('⌘⇧K');
    expect(formatShortcut(shortcut, false)).toBe('Ctrl+Shift+K');
  });

  it('formats no modifiers', () => {
    const shortcut: ShortcutDef = {
      id: 'escape',
      key: 'Esc',
      modifiers: [],
      label: 'Escape',
      description: '',
      category: 'Nav',
    };
    expect(formatShortcut(shortcut, false)).toBe('Esc');
  });
});

describe('SHORTCUTS', () => {
  it('has unique ids', () => {
    const ids = SHORTCUTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes save-document shortcut', () => {
    expect(SHORTCUTS.find((s) => s.id === 'save-document')).toBeDefined();
  });

  it('includes run-query shortcut', () => {
    expect(SHORTCUTS.find((s) => s.id === 'run-query')).toBeDefined();
  });
});
