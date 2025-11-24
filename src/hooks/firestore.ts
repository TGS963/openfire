import { useQuery } from '@tanstack/react-query';

import { getDocument, listCollections, listDocuments } from '@/lib/tauri';
import { useAuthStore } from '@/stores/auth-store';
import type { CollectionList, DocumentPage, FirestoreDocument } from '@/types/firestore';

export function useCollections(parentPath?: string | null) {
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  return useQuery<CollectionList>({
    queryKey: ['collections', activeAccountId, parentPath ?? '__root__'],
    queryFn: () => listCollections(parentPath),
    enabled: Boolean(activeAccountId),
    staleTime: 30_000,
  });
}

export function useDocuments(collectionPath: string | null) {
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  return useQuery<DocumentPage>({
    queryKey: ['documents', activeAccountId, collectionPath],
    queryFn: () => listDocuments(collectionPath!),
    enabled: Boolean(activeAccountId && collectionPath),
    placeholderData: (previousData) => previousData,
  });
}

export function useDocument(documentPath: string | null) {
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  return useQuery<FirestoreDocument>({
    queryKey: ['document', activeAccountId, documentPath],
    queryFn: () => getDocument(documentPath!),
    enabled: Boolean(activeAccountId && documentPath),
  });
}



