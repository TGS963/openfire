export const getErrorMessage = (err: unknown, fallback = 'Unexpected error'): string =>
  err instanceof Error ? err.message : typeof err === 'string' ? err : fallback;
