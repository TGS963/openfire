import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
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

function useConnectionKey() {
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

export function useDocuments(collectionPath: string | null) {
  const { key, hasConnection } = useConnectionKey();
  return useQuery<DocumentPage>({
    queryKey: ['documents', key, collectionPath],
    queryFn: () => listDocuments(collectionPath!),
    enabled: hasConnection && Boolean(collectionPath),
    placeholderData: (previousData) => previousData,
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
          queryKey: ['documents', key, collection],
        });
      }
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
        queryKey: ['documents', key, collectionPath],
      });
      queryClient.invalidateQueries({
        queryKey: ['collections'],
        exact: false,
      });
    },
  });
}
