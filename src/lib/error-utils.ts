export const getErrorMessage = (err: unknown, fallback = 'Unexpected error'): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  // Tauri invoke errors surface as plain objects; pick the first string-shaped
  // field that typically carries the human message.
  if (err && typeof err === 'object') {
    for (const key of ['message', 'error', 'description'] as const) {
      const value = (err as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
  }
  return fallback;
};
