import { invoke } from '@tauri-apps/api/core';

import type { DocumentPage, FilterOperator, FirestoreDocument, QueryFilter } from '@/types/firestore';

type ScriptDoc = { id: string; path: string; data: Record<string, unknown> };

const toScriptDoc = (doc: FirestoreDocument): ScriptDoc => ({
  id: doc.id,
  path: doc.path,
  data: doc.data,
});

type DocRef = {
  get: () => Promise<ScriptDoc>;
  set: (data: Record<string, unknown>) => Promise<ScriptDoc>;
  delete: () => Promise<void>;
};

const createDocRef = (documentPath: string): DocRef => ({
  get: async () =>
    toScriptDoc(await invoke<FirestoreDocument>('get_document', { documentPath })),
  set: async (data) =>
    toScriptDoc(await invoke<FirestoreDocument>('save_document', { documentPath, data })),
  delete: () => invoke<void>('delete_document', { documentPath }),
});

type CollectionRef = {
  where: (field: string, operator: FilterOperator, value: unknown) => CollectionRef;
  doc: (id: string) => DocRef;
  get: () => Promise<ScriptDoc[]>;
};

const createCollectionRef = (collectionPath: string, filters: QueryFilter[] = []): CollectionRef => ({
  where: (field, operator, value) =>
    createCollectionRef(collectionPath, [...filters, { field, operator, value }]),
  doc: (id) => createDocRef(`${collectionPath}/${id}`),
  get: async () => {
    const page =
      filters.length > 0
        ? await invoke<DocumentPage>('query_documents', {
            query: { collectionPath, filters, orderBy: [], limit: null },
          })
        : await invoke<DocumentPage>('list_documents', {
            collectionPath,
            pageSize: 100,
            pageToken: null,
          });
    return page.documents.map(toScriptDoc);
  },
});

type DbApi = {
  collection: (path: string) => CollectionRef;
};

export function createDbApi(): DbApi {
  return {
    collection: (path) => createCollectionRef(path),
  };
}

function stringify(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'undefined') return 'undefined';
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

export async function executeScript(
  script: string,
  db: DbApi,
  onLog: (type: 'log' | 'error', content: string) => void,
): Promise<unknown> {
  const customConsole = {
    log: (...args: unknown[]) => onLog('log', args.map(stringify).join(' ')),
    error: (...args: unknown[]) => onLog('error', args.map(stringify).join(' ')),
    warn: (...args: unknown[]) => onLog('log', args.map(stringify).join(' ')),
    info: (...args: unknown[]) => onLog('log', args.map(stringify).join(' ')),
  };

  // Use AsyncFunction constructor to allow top-level await
  const AsyncFunction = async function () {}.constructor as new (
    ...args: string[]
  ) => (...args: unknown[]) => Promise<unknown>;

  // Try as statements first, then fall back to expression wrapper for return values
  let fn: (...args: unknown[]) => Promise<unknown>;
  try {
    // Try wrapping as expression to capture return value (e.g. "1 + 2")
    fn = new AsyncFunction('db', 'console', `return (${script}\n);`);
    // Validate it parses — actually run it below
  } catch {
    // If it doesn't parse as an expression, run as statements
    fn = new AsyncFunction('db', 'console', script);
  }

  return await fn(db, customConsole);
}
