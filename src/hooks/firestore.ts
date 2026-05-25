import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  countDocuments,
  deleteCollection,
  deleteDocument,
  getDocument,
  listCollections,
  listDocuments,
  queryDocuments,
} from '@/lib/tauri';
import { collectionFromDocPath } from '@/lib/firestore-utils';
import { useAuthStore } from '@/stores/auth-store';
import { useConnectionStore } from '@/stores/connection-store';
import type { CollectionList, DocumentPage, FirestoreDocument, QuerySpec } from '@/types/firestore';

export function useConnectionKey() {
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const connectionMode = useAuthStore((state) => state.connectionMode);
  // Use connectionId if available, fall back to accountId for backward compat
  const key = activeConnectionId ?? activeAccountId;
  const hasConnection = Boolean(key) || connectionMode === 'emulator';
  return { key, hasConnection };
}

export function useCollections(parentPath?: string | null) {
  const { key, hasConnection } = useConnectionKey();
  return useQuery<CollectionList>({
    queryKey: ['collections', key, parentPath ?? '__root__'],
    queryFn: () => listCollections(parentPath),
    enabled: hasConnection,
    staleTime: 30_000,
  });
}

/** Paginated list keyed by collection path. Each page = one Firestore page. */
export function useDocumentsInfinite(collectionPath: string | null, pageSize = 100) {
  const { key, hasConnection } = useConnectionKey();
  return useInfiniteQuery({
    queryKey: ['documentsInf', key, collectionPath, pageSize],
    queryFn: ({ pageParam }) =>
      listDocuments(collectionPath!, pageSize, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextPageToken ?? undefined,
    enabled: hasConnection && Boolean(collectionPath),
  });
}

/**
 * Exact server-side document count for a collection. Click-triggered only
 * (`enabled: false`); call `.refetch()` to fetch. Keyed by collection + connection
 * so switching either shows no stale count until requested again.
 */
export function useDocumentCount(collectionPath: string | null) {
  const { key } = useConnectionKey();
  return useQuery<number>({
    queryKey: ['docCount', key, collectionPath],
    queryFn: () => countDocuments(collectionPath!),
    enabled: false,
    staleTime: 30_000,
  });
}

export function useDocument(documentPath: string | null) {
  const { key, hasConnection } = useConnectionKey();
  return useQuery<FirestoreDocument>({
    queryKey: ['document', key, documentPath],
    queryFn: () => getDocument(documentPath!),
    enabled: hasConnection && Boolean(documentPath),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { key } = useConnectionKey();

  return useMutation({
    mutationFn: (documentPath: string) => deleteDocument(documentPath),
    onSuccess: (_data, documentPath) => {
      const collection = collectionFromDocPath(documentPath);
      if (collection) {
        queryClient.invalidateQueries({
          queryKey: ['documentsInf', key, collection],
          exact: false,
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['queryDocuments', key],
        exact: false,
      });
      // Drop the cached count so the chip reverts to its clickable state — a
      // disabled query keeps stale data through invalidate, so remove it.
      queryClient.removeQueries({
        queryKey: ['docCount', key],
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: ['document', key, documentPath],
      });
    },
  });
}

export function useQueryDocuments(query: QuerySpec | null) {
  const { key, hasConnection } = useConnectionKey();
  return useQuery<DocumentPage>({
    queryKey: ['queryDocuments', key, query],
    queryFn: () => queryDocuments(query!),
    enabled: hasConnection && Boolean(query),
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const { key } = useConnectionKey();

  return useMutation({
    mutationFn: (collectionPath: string) => deleteCollection(collectionPath),
    onSuccess: (_count, collectionPath) => {
      queryClient.invalidateQueries({
        queryKey: ['documentsInf', key, collectionPath],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ['collections'],
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: ['docCount', key],
        exact: false,
      });
    },
  });
}
