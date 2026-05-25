export const normalizeFirestorePath = (value: string) =>
  value
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');

export const collectionFromDocPath = (path: string) => {
  const normalized = normalizeFirestorePath(path);
  if (!normalized) return '';
  const parts = normalized.split('/');
  return parts.slice(0, -1).join('/');
};

/**
 * JSON serialization with object keys sorted recursively. Array order is
 * preserved (significant in Firestore). Used to compare field values without
 * being fooled by key ordering.
 */
export const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};

/** Order-insensitive (for object keys) deep equality of two field values. */
export const fieldValuesEqual = (a: unknown, b: unknown): boolean =>
  stableStringify(a) === stableStringify(b);
