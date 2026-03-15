import { useEffect, useRef } from 'react';

import { SHORTCUTS, matchesShortcut } from '@/lib/keyboard-shortcuts';

const ALWAYS_ALLOW = new Set(['save-document', 'escape', 'toggle-shell', 'run-script']);

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const inEditable = isEditableTarget(event.target);

      for (const shortcut of SHORTCUTS) {
        const handler = handlersRef.current[shortcut.id];
        if (!handler) continue;
        if (!matchesShortcut(event, shortcut, isMac)) continue;
        if (inEditable && !ALWAYS_ALLOW.has(shortcut.id)) continue;

        event.preventDefault();
        handler();
        return;
      }
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);
}
