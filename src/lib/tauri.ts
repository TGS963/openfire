import { invoke } from '@tauri-apps/api/core';

import type {
  CollectionList,
  ConnectionEntry,
  ConnectionInfo,
  DocumentPage,
  FirestoreDocument,
  ImportMode,
  ImportResult,
  QuerySpec,
  ServiceAccountSummary,
  TransferResult,
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

export async function saveDocument(documentPath: string, data: Record<string, unknown>) {
  return invoke<FirestoreDocument>('save_document', { documentPath, data });
}

export async function duplicateDocument(
  sourcePath: string,
  targetPath: string,
  overwrite = false,
) {
  return invoke<FirestoreDocument>('duplicate_document', { sourcePath, targetPath, overwrite });
}

export async function duplicateCollection(
  sourceCollectionPath: string,
  targetCollectionPath: string,
  overwrite = false,
) {
  return invoke<number>('duplicate_collection', {
    sourceCollectionPath,
    targetCollectionPath,
    overwrite,
  });
}

export async function deleteDocument(documentPath: string) {
  return invoke<void>('delete_document', { documentPath });
}

export async function deleteCollection(collectionPath: string) {
  return invoke<number>('delete_collection', { collectionPath });
}

export async function queryDocuments(query: QuerySpec) {
  return invoke<DocumentPage>('query_documents', { query });
}

export async function exportCollection(collectionPath: string, filePath: string) {
  return invoke<number>('export_collection', { collectionPath, filePath });
}

export async function importCollection(
  collectionPath: string,
  filePath: string,
  mode: ImportMode,
) {
  return invoke<ImportResult>('import_collection', { collectionPath, filePath, mode });
}

export async function connectEmulator(projectId: string, emulatorUrl: string) {
  return invoke<ConnectionInfo>('connect_emulator', { projectId, emulatorUrl });
}

export async function disconnectEmulator() {
  return invoke<void>('disconnect_emulator');
}

export async function getConnectionInfo() {
  return invoke<ConnectionInfo | null>('get_connection_info');
}

export async function listConnections() {
  return invoke<ConnectionEntry[]>('list_connections');
}

export async function removeConnection(connectionId: string) {
  return invoke<void>('remove_connection', { connectionId });
}

export async function setActiveConnection(connectionId: string) {
  return invoke<void>('set_active_connection', { connectionId });
}

export async function transferDocuments(
  sourceConnectionId: string,
  destConnectionId: string,
  sourceCollectionPath: string,
  destCollectionPath: string,
  overwrite = false,
) {
  return invoke<TransferResult>('transfer_documents', {
    sourceConnectionId,
    destConnectionId,
    sourceCollectionPath,
    destCollectionPath,
    overwrite,
  });
}

