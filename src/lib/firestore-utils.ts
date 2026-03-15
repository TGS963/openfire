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
