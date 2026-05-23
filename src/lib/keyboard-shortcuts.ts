export type ShortcutModifier = 'mod' | 'shift' | 'alt';

export type ShortcutDef = {
  id: string;
  key: string;
  modifiers: ShortcutModifier[];
  label: string;
  description: string;
  category: string;
};

export const SHORTCUTS: ShortcutDef[] = [
  {
    id: 'save-document',
    key: 's',
    modifiers: ['mod'],
    label: 'Save',
    description: 'Save current document',
    category: 'Document',
  },
  {
    id: 'run-query',
    key: 'Enter',
    modifiers: ['mod'],
    label: 'Run Query',
    description: 'Run current query',
    category: 'Query',
  },
  {
    id: 'toggle-query',
    key: 'f',
    modifiers: ['mod'],
    label: 'Toggle Query',
    description: 'Toggle query panel',
    category: 'Query',
  },
  {
    id: 'open-palette',
    key: 'k',
    modifiers: ['mod'],
    label: 'Command Palette',
    description: 'Open the command palette',
    category: 'Navigation',
  },
  {
    id: 'goto-path',
    key: 'l',
    modifiers: ['mod'],
    label: 'Go to Path',
    description: 'Jump to a collection or document path',
    category: 'Navigation',
  },
  {
    id: 'escape',
    key: 'Escape',
    modifiers: [],
    label: 'Escape',
    description: 'Close dialog or panel',
    category: 'Navigation',
  },
  {
    id: 'toggle-shell',
    key: 'j',
    modifiers: ['mod'],
    label: 'Toggle Shell',
    description: 'Toggle script shell panel',
    category: 'Shell',
  },
  {
    id: 'run-script',
    key: 'Enter',
    modifiers: ['mod', 'shift'],
    label: 'Run Script',
    description: 'Run current script',
    category: 'Shell',
  },
  {
    id: 'show-shortcuts',
    key: '/',
    modifiers: ['mod'],
    label: 'Show Shortcuts',
    description: 'Show keyboard shortcuts',
    category: 'Help',
  },
  {
    id: 'new-tab',
    key: 't',
    modifiers: ['mod'],
    label: 'New Tab',
    description: 'Open a new tab',
    category: 'Tabs',
  },
  {
    id: 'close-tab',
    key: 'w',
    modifiers: ['mod'],
    label: 'Close Tab',
    description: 'Close the active tab',
    category: 'Tabs',
  },
  {
    id: 'prev-tab',
    key: 'ArrowLeft',
    modifiers: ['mod', 'alt'],
    label: 'Previous Tab',
    description: 'Switch to the previous tab',
    category: 'Tabs',
  },
  {
    id: 'next-tab',
    key: 'ArrowRight',
    modifiers: ['mod', 'alt'],
    label: 'Next Tab',
    description: 'Switch to the next tab',
    category: 'Tabs',
  },
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `switch-tab-${i + 1}`,
    key: `${i + 1}`,
    modifiers: ['mod'] as ShortcutModifier[],
    label: `Switch to Tab ${i + 1}`,
    description: `Activate tab ${i + 1}`,
    category: 'Tabs',
  })),
];

export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutDef,
  isMac: boolean,
): boolean {
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) return false;

  const needsMod = shortcut.modifiers.includes('mod');
  const needsShift = shortcut.modifiers.includes('shift');
  const needsAlt = shortcut.modifiers.includes('alt');

  const modPressed = isMac ? event.metaKey : event.ctrlKey;

  if (needsMod !== modPressed) return false;
  if (needsShift !== event.shiftKey) return false;
  if (needsAlt !== event.altKey) return false;

  return true;
}

export function formatShortcut(shortcut: ShortcutDef, isMac: boolean): string {
  if (isMac) {
    const parts: string[] = [];
    if (shortcut.modifiers.includes('mod')) parts.push('⌘');
    if (shortcut.modifiers.includes('shift')) parts.push('⇧');
    if (shortcut.modifiers.includes('alt')) parts.push('⌥');
    parts.push(shortcut.key);
    return parts.join('');
  }

  const parts: string[] = [];
  if (shortcut.modifiers.includes('mod')) parts.push('Ctrl');
  if (shortcut.modifiers.includes('shift')) parts.push('Shift');
  if (shortcut.modifiers.includes('alt')) parts.push('Alt');
  parts.push(shortcut.key);
  return parts.join('+');
}
