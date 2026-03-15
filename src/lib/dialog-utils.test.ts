import { describe, expect, it, vi, beforeEach } from 'vitest';

import { openFileDialog } from '@/lib/dialog-utils';

const mockOpenDialogPlugin = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: (...args: unknown[]) => mockOpenDialogPlugin(...args),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('openFileDialog', () => {
  const filters = [{ name: 'JSON', extensions: ['json'] }];

  it('returns file path from plugin dialog', async () => {
    mockOpenDialogPlugin.mockResolvedValue('/path/to/file.json');
    const result = await openFileDialog({ filters, multiple: false });
    expect(result).toBe('/path/to/file.json');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('unwraps array result to first element', async () => {
    mockOpenDialogPlugin.mockResolvedValue(['/path/to/file.json']);
    const result = await openFileDialog({ filters, multiple: false });
    expect(result).toBe('/path/to/file.json');
  });

  it('falls back to invoke when plugin throws', async () => {
    mockOpenDialogPlugin.mockRejectedValue(new Error('plugin unavailable'));
    mockInvoke.mockResolvedValue('/fallback/file.json');
    const result = await openFileDialog({ filters, multiple: false });
    expect(result).toBe('/fallback/file.json');
    expect(mockInvoke).toHaveBeenCalledWith('plugin:dialog|open', {
      options: { filters, multiple: false },
      windowLabel: 'main',
    });
  });

  it('returns null when both plugin and invoke fail', async () => {
    mockOpenDialogPlugin.mockRejectedValue(new Error('plugin fail'));
    mockInvoke.mockRejectedValue(new Error('invoke fail'));
    const result = await openFileDialog({ filters, multiple: false });
    expect(result).toBeNull();
  });

  it('returns null when dialog is cancelled', async () => {
    mockOpenDialogPlugin.mockResolvedValue(null);
    const result = await openFileDialog({ filters, multiple: false });
    expect(result).toBeNull();
  });

  it('returns null for empty array result', async () => {
    mockOpenDialogPlugin.mockResolvedValue([]);
    const result = await openFileDialog({ filters, multiple: false });
    expect(result).toBeNull();
  });
});
