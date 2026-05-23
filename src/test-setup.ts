import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom lacks Element.scrollIntoView (needed by cmdk's active-item tracking)
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// Polyfill ResizeObserver for jsdom (needed by react-resizable-panels)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}

// jsdom blocks localStorage for opaque origins; provide an in-memory shim so
// zustand `persist` middleware works in tests.
const installMemoryStorage = (key: 'localStorage' | 'sessionStorage') => {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? (store.get(k) as string) : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => {
      store.delete(k);
    },
    setItem: (k, v) => {
      store.set(k, String(v));
    },
  };
  Object.defineProperty(globalThis, key, { value: storage, configurable: true });
  Object.defineProperty(globalThis.window, key, { value: storage, configurable: true });
};

for (const key of ['localStorage', 'sessionStorage'] as const) {
  try {
    // Touch native storage; jsdom throws SecurityError for opaque origins.
    void globalThis.window[key].length;
  } catch {
    installMemoryStorage(key);
  }
}

// Mock Tauri API core — all invoke calls are mocked by default
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));
