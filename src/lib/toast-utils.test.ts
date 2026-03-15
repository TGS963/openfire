import { describe, expect, it, vi } from 'vitest';

import { toastError } from '@/lib/toast-utils';

describe('toastError', () => {
  it('calls toast with destructive variant and error message', () => {
    const toast = vi.fn();
    toastError(toast, 'Save failed', new Error('Network timeout'));
    expect(toast).toHaveBeenCalledWith({
      title: 'Save failed',
      description: 'Network timeout',
      variant: 'destructive',
    });
  });

  it('uses fallback for non-Error values', () => {
    const toast = vi.fn();
    toastError(toast, 'Import failed', 'some string');
    expect(toast).toHaveBeenCalledWith({
      title: 'Import failed',
      description: 'some string',
      variant: 'destructive',
    });
  });

  it('uses default fallback for unknown error types', () => {
    const toast = vi.fn();
    toastError(toast, 'Delete failed', 42);
    expect(toast).toHaveBeenCalledWith({
      title: 'Delete failed',
      description: 'Unexpected error',
      variant: 'destructive',
    });
  });
});
