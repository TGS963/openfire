import { describe, expect, it } from 'vitest';

import { getErrorMessage } from '@/lib/error-utils';

describe('getErrorMessage', () => {
  it('extracts message from Error instances', () => {
    expect(getErrorMessage(new Error('something broke'))).toBe('something broke');
  });

  it('returns string errors as-is', () => {
    expect(getErrorMessage('plain string error')).toBe('plain string error');
  });

  it('returns default fallback for non-Error, non-string values', () => {
    expect(getErrorMessage(42)).toBe('Unexpected error');
    expect(getErrorMessage(null)).toBe('Unexpected error');
    expect(getErrorMessage(undefined)).toBe('Unexpected error');
    expect(getErrorMessage({ code: 500 })).toBe('Unexpected error');
  });

  it('unwraps message field from object errors (Tauri invoke shape)', () => {
    expect(getErrorMessage({ message: 'permission denied' })).toBe('permission denied');
    expect(getErrorMessage({ error: 'token expired' })).toBe('token expired');
    expect(getErrorMessage({ description: 'rate limited' })).toBe('rate limited');
  });

  it('uses custom fallback when provided', () => {
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });
});
