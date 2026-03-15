import { invoke } from '@tauri-apps/api/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  importServiceAccount,
  listServiceAccounts,
  setActiveAccount,
  listCollections,
  listDocuments,
  getDocument,
  saveDocument,
  duplicateDocument,
  duplicateCollection,
  deleteDocument,
  deleteCollection,
  queryDocuments,
  exportCollection,
  importCollection,
  connectEmulator,
  disconnectEmulator,
  getConnectionInfo,
  listConnections,
  removeConnection,
  setActiveConnection,
  transferDocuments,
} from '@/lib/tauri';

const mockedInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('importServiceAccount', () => {
  it('calls invoke with correct command and params', async () => {
    const summary = { id: '1', projectId: 'proj', clientEmail: 'a@b.com' };
    mockedInvoke.mockResolvedValueOnce(summary);
    const result = await importServiceAccount('/path/to/file.json');
    expect(mockedInvoke).toHaveBeenCalledWith('import_service_account', { filePath: '/path/to/file.json' });
    expect(result).toEqual(summary);
  });
});

describe('listServiceAccounts', () => {
  it('calls invoke with correct command', async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    const result = await listServiceAccounts();
    expect(mockedInvoke).toHaveBeenCalledWith('list_service_accounts');
    expect(result).toEqual([]);
  });
});

describe('setActiveAccount', () => {
  it('calls invoke with account id', async () => {
    const summary = { id: 'acc1', projectId: 'proj', clientEmail: 'a@b.com' };
    mockedInvoke.mockResolvedValueOnce(summary);
    const result = await setActiveAccount('acc1');
    expect(mockedInvoke).toHaveBeenCalledWith('set_active_account', { accountId: 'acc1' });
    expect(result).toEqual(summary);
  });
});

describe('listCollections', () => {
  it('calls with null parent by default', async () => {
    mockedInvoke.mockResolvedValueOnce({ collectionIds: ['users'], nextPageToken: null });
    await listCollections();
    expect(mockedInvoke).toHaveBeenCalledWith('list_collections', { parentPath: null, pageSize: 100 });
  });

  it('passes parentPath when provided', async () => {
    mockedInvoke.mockResolvedValueOnce({ collectionIds: [], nextPageToken: null });
    await listCollections('users/doc1');
    expect(mockedInvoke).toHaveBeenCalledWith('list_collections', { parentPath: 'users/doc1', pageSize: 100 });
  });
});

describe('listDocuments', () => {
  it('calls with collection path and default page size', async () => {
    mockedInvoke.mockResolvedValueOnce({ documents: [], nextPageToken: null });
    await listDocuments('users');
    expect(mockedInvoke).toHaveBeenCalledWith('list_documents', {
      collectionPath: 'users',
      pageSize: 100,
      pageToken: null,
    });
  });
});

describe('getDocument', () => {
  it('calls with document path', async () => {
    const doc = { id: 'doc1', path: 'users/doc1', data: {}, createTime: null, updateTime: null };
    mockedInvoke.mockResolvedValueOnce(doc);
    const result = await getDocument('users/doc1');
    expect(mockedInvoke).toHaveBeenCalledWith('get_document', { documentPath: 'users/doc1' });
    expect(result).toEqual(doc);
  });
});

describe('saveDocument', () => {
  it('calls with path and data', async () => {
    const doc = { id: 'doc1', path: 'users/doc1', data: { name: 'test' }, createTime: null, updateTime: null };
    mockedInvoke.mockResolvedValueOnce(doc);
    const result = await saveDocument('users/doc1', { name: 'test' });
    expect(mockedInvoke).toHaveBeenCalledWith('save_document', {
      documentPath: 'users/doc1',
      data: { name: 'test' },
    });
    expect(result).toEqual(doc);
  });
});

describe('duplicateDocument', () => {
  it('calls with source, target, and overwrite flag', async () => {
    mockedInvoke.mockResolvedValueOnce({});
    await duplicateDocument('users/doc1', 'users/doc1-copy', true);
    expect(mockedInvoke).toHaveBeenCalledWith('duplicate_document', {
      sourcePath: 'users/doc1',
      targetPath: 'users/doc1-copy',
      overwrite: true,
    });
  });

  it('defaults overwrite to false', async () => {
    mockedInvoke.mockResolvedValueOnce({});
    await duplicateDocument('users/doc1', 'users/doc1-copy');
    expect(mockedInvoke).toHaveBeenCalledWith('duplicate_document', {
      sourcePath: 'users/doc1',
      targetPath: 'users/doc1-copy',
      overwrite: false,
    });
  });
});

describe('duplicateCollection', () => {
  it('calls with source, target, and overwrite', async () => {
    mockedInvoke.mockResolvedValueOnce(5);
    const result = await duplicateCollection('users', 'users_copy', true);
    expect(mockedInvoke).toHaveBeenCalledWith('duplicate_collection', {
      sourceCollectionPath: 'users',
      targetCollectionPath: 'users_copy',
      overwrite: true,
    });
    expect(result).toBe(5);
  });
});

describe('deleteDocument', () => {
  it('calls invoke with correct command and path', async () => {
    mockedInvoke.mockResolvedValueOnce(undefined);
    await deleteDocument('users/doc1');
    expect(mockedInvoke).toHaveBeenCalledWith('delete_document', { documentPath: 'users/doc1' });
  });

  it('propagates errors', async () => {
    mockedInvoke.mockRejectedValueOnce(new Error('Not found'));
    await expect(deleteDocument('users/nonexistent')).rejects.toThrow('Not found');
  });
});

describe('deleteCollection', () => {
  it('calls invoke and returns deleted count', async () => {
    mockedInvoke.mockResolvedValueOnce(10);
    const result = await deleteCollection('users');
    expect(mockedInvoke).toHaveBeenCalledWith('delete_collection', { collectionPath: 'users' });
    expect(result).toBe(10);
  });

  it('propagates errors', async () => {
    mockedInvoke.mockRejectedValueOnce(new Error('Permission denied'));
    await expect(deleteCollection('users')).rejects.toThrow('Permission denied');
  });
});

describe('queryDocuments', () => {
  it('calls invoke with query spec', async () => {
    const query = {
      collectionPath: 'users',
      filters: [{ field: 'age', operator: '>=' as const, value: 18 }],
      orderBy: [{ field: 'age', direction: 'desc' as const }],
      limit: 10,
    };
    const page = { documents: [], nextPageToken: null };
    mockedInvoke.mockResolvedValueOnce(page);
    const result = await queryDocuments(query);
    expect(mockedInvoke).toHaveBeenCalledWith('query_documents', { query });
    expect(result).toEqual(page);
  });

  it('works with empty filters and orderBy', async () => {
    const query = {
      collectionPath: 'posts',
      filters: [],
      orderBy: [],
    };
    mockedInvoke.mockResolvedValueOnce({ documents: [], nextPageToken: null });
    await queryDocuments(query);
    expect(mockedInvoke).toHaveBeenCalledWith('query_documents', { query });
  });
});

describe('exportCollection', () => {
  it('calls invoke with collection path and file path', async () => {
    mockedInvoke.mockResolvedValueOnce(42);
    const result = await exportCollection('users', '/tmp/users.json');
    expect(mockedInvoke).toHaveBeenCalledWith('export_collection', {
      collectionPath: 'users',
      filePath: '/tmp/users.json',
    });
    expect(result).toBe(42);
  });

  it('propagates errors', async () => {
    mockedInvoke.mockRejectedValueOnce(new Error('Write failed'));
    await expect(exportCollection('users', '/bad/path.json')).rejects.toThrow('Write failed');
  });
});

describe('importCollection', () => {
  it('calls invoke with collection path, file path, and create_only mode', async () => {
    const result = { imported: 10, skipped: 2 };
    mockedInvoke.mockResolvedValueOnce(result);
    const actual = await importCollection('users', '/tmp/users.json', 'create_only');
    expect(mockedInvoke).toHaveBeenCalledWith('import_collection', {
      collectionPath: 'users',
      filePath: '/tmp/users.json',
      mode: 'create_only',
    });
    expect(actual).toEqual(result);
  });

  it('calls invoke with overwrite mode', async () => {
    mockedInvoke.mockResolvedValueOnce({ imported: 5, skipped: 0 });
    await importCollection('posts', '/tmp/posts.json', 'overwrite');
    expect(mockedInvoke).toHaveBeenCalledWith('import_collection', {
      collectionPath: 'posts',
      filePath: '/tmp/posts.json',
      mode: 'overwrite',
    });
  });

  it('propagates errors', async () => {
    mockedInvoke.mockRejectedValueOnce(new Error('Invalid JSON'));
    await expect(importCollection('users', '/tmp/bad.json', 'create_only')).rejects.toThrow('Invalid JSON');
  });
});

describe('connectEmulator', () => {
  it('calls invoke with project id and emulator url', async () => {
    const info = { mode: 'emulator' as const, projectId: 'my-project', emulatorUrl: 'http://localhost:8080' };
    mockedInvoke.mockResolvedValueOnce(info);
    const result = await connectEmulator('my-project', 'http://localhost:8080');
    expect(mockedInvoke).toHaveBeenCalledWith('connect_emulator', {
      projectId: 'my-project',
      emulatorUrl: 'http://localhost:8080',
    });
    expect(result).toEqual(info);
  });

  it('propagates errors', async () => {
    mockedInvoke.mockRejectedValueOnce(new Error('Connection refused'));
    await expect(connectEmulator('proj', 'http://bad:9999')).rejects.toThrow('Connection refused');
  });
});

describe('disconnectEmulator', () => {
  it('calls invoke with correct command', async () => {
    mockedInvoke.mockResolvedValueOnce(undefined);
    await disconnectEmulator();
    expect(mockedInvoke).toHaveBeenCalledWith('disconnect_emulator');
  });
});

describe('getConnectionInfo', () => {
  it('returns connection info when connected', async () => {
    const info = { mode: 'production' as const, projectId: 'proj-1', emulatorUrl: null };
    mockedInvoke.mockResolvedValueOnce(info);
    const result = await getConnectionInfo();
    expect(mockedInvoke).toHaveBeenCalledWith('get_connection_info');
    expect(result).toEqual(info);
  });

  it('returns null when not connected', async () => {
    mockedInvoke.mockResolvedValueOnce(null);
    const result = await getConnectionInfo();
    expect(result).toBeNull();
  });
});

describe('listConnections', () => {
  it('calls invoke with correct command', async () => {
    const entries = [{ id: 'prod-proj', mode: { type: 'production' }, isActive: true }];
    mockedInvoke.mockResolvedValueOnce(entries);
    const result = await listConnections();
    expect(mockedInvoke).toHaveBeenCalledWith('list_connections');
    expect(result).toEqual(entries);
  });
});

describe('removeConnection', () => {
  it('calls invoke with connection id', async () => {
    mockedInvoke.mockResolvedValueOnce(undefined);
    await removeConnection('prod-proj');
    expect(mockedInvoke).toHaveBeenCalledWith('remove_connection', { connectionId: 'prod-proj' });
  });
});

describe('setActiveConnection', () => {
  it('calls invoke with connection id', async () => {
    mockedInvoke.mockResolvedValueOnce(undefined);
    await setActiveConnection('emu-demo');
    expect(mockedInvoke).toHaveBeenCalledWith('set_active_connection', { connectionId: 'emu-demo' });
  });
});

describe('transferDocuments', () => {
  it('calls invoke with all parameters', async () => {
    const result = { transferred: 10, skipped: 2 };
    mockedInvoke.mockResolvedValueOnce(result);
    const actual = await transferDocuments('prod-a', 'prod-b', 'users', 'users_backup', true);
    expect(mockedInvoke).toHaveBeenCalledWith('transfer_documents', {
      sourceConnectionId: 'prod-a',
      destConnectionId: 'prod-b',
      sourceCollectionPath: 'users',
      destCollectionPath: 'users_backup',
      overwrite: true,
    });
    expect(actual).toEqual(result);
  });

  it('defaults overwrite to false', async () => {
    mockedInvoke.mockResolvedValueOnce({ transferred: 5, skipped: 0 });
    await transferDocuments('a', 'b', 'col', 'col2');
    expect(mockedInvoke).toHaveBeenCalledWith('transfer_documents', {
      sourceConnectionId: 'a',
      destConnectionId: 'b',
      sourceCollectionPath: 'col',
      destCollectionPath: 'col2',
      overwrite: false,
    });
  });
});
