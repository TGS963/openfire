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
    key: 'q',
    modifiers: ['mod'],
    label: 'Toggle Query',
    description: 'Toggle query panel',
    category: 'Query',
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
