import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Polyfill ResizeObserver for jsdom (needed by react-resizable-panels)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}

// Mock Tauri API core — all invoke calls are mocked by default
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));
