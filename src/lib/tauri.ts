import { invoke } from '@tauri-apps/api/core';

import type {
  CollectionList,
  DocumentPage,
  FirestoreDocument,
  ServiceAccountSummary,
} from '@/types/firestore';

export async function importServiceAccount(filePath: string) {
  return invoke<ServiceAccountSummary>('import_service_account', { filePath });
}

export async function listServiceAccounts() {
  return invoke<ServiceAccountSummary[]>('list_service_accounts');
}

export async function setActiveAccount(accountId: string) {
  return invoke<ServiceAccountSummary>('set_active_account', { accountId });
}

export async function listCollections(parentPath?: string | null, pageSize = 100) {
  return invoke<CollectionList>('list_collections', {
    parentPath: parentPath ?? null,
    pageSize,
  });
}

export async function listDocuments(collectionPath: string, pageSize = 100) {
  return invoke<DocumentPage>('list_documents', {
    collectionPath,
    pageSize,
    pageToken: null,
  });
}

export async function getDocument(documentPath: string) {
  return invoke<FirestoreDocument>('get_document', { documentPath });
}



