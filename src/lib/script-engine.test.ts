import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

import { createDbApi, executeScript } from '@/lib/script-engine';

const mockInvoke = vi.mocked(invoke);

describe('script-engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDbApi', () => {
    it('db.collection("users").get() calls list_documents', async () => {
      mockInvoke.mockResolvedValueOnce({ documents: [{ id: 'u1', path: 'users/u1', data: {} }], nextPageToken: null });
      const db = createDbApi();
      const result = await db.collection('users').get();
      expect(mockInvoke).toHaveBeenCalledWith('list_documents', {
        collectionPath: 'users',
        pageSize: 100,
        pageToken: null,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('u1');
    });

    it('db.collection("users").where() chains filters and calls query_documents', async () => {
      mockInvoke.mockResolvedValueOnce({ documents: [{ id: 'u2', path: 'users/u2', data: { age: 35 } }], nextPageToken: null });
      const db = createDbApi();
      const result = await db.collection('users').where('age', '>', 30).get();
      expect(mockInvoke).toHaveBeenCalledWith('query_documents', {
        query: {
          collectionPath: 'users',
          filters: [{ field: 'age', operator: '>', value: 30 }],
          orderBy: [],
          limit: null,
        },
      });
      expect(result).toHaveLength(1);
    });

    it('supports multiple where() chains', async () => {
      mockInvoke.mockResolvedValueOnce({ documents: [], nextPageToken: null });
      const db = createDbApi();
      await db.collection('users').where('age', '>', 20).where('active', '==', true).get();
      expect(mockInvoke).toHaveBeenCalledWith('query_documents', {
        query: {
          collectionPath: 'users',
          filters: [
            { field: 'age', operator: '>', value: 20 },
            { field: 'active', operator: '==', value: true },
          ],
          orderBy: [],
          limit: null,
        },
      });
    });

    it('db.collection("users").doc("abc").get() calls get_document', async () => {
      mockInvoke.mockResolvedValueOnce({ id: 'abc', path: 'users/abc', data: { name: 'Alice' } });
      const db = createDbApi();
      const result = await db.collection('users').doc('abc').get();
      expect(mockInvoke).toHaveBeenCalledWith('get_document', { documentPath: 'users/abc' });
      expect(result.data.name).toBe('Alice');
    });

    it('db.collection("users").doc("abc").set() calls save_document', async () => {
      mockInvoke.mockResolvedValueOnce({ id: 'abc', path: 'users/abc', data: { name: 'Bob' } });
      const db = createDbApi();
      await db.collection('users').doc('abc').set({ name: 'Bob' });
      expect(mockInvoke).toHaveBeenCalledWith('save_document', {
        documentPath: 'users/abc',
        data: { name: 'Bob' },
      });
    });

    it('db.collection("users").doc("abc").delete() calls delete_document', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      const db = createDbApi();
      await db.collection('users').doc('abc').delete();
      expect(mockInvoke).toHaveBeenCalledWith('delete_document', { documentPath: 'users/abc' });
    });

    it('get() returns mapped documents with id, path, and data', async () => {
      mockInvoke.mockResolvedValueOnce({
        documents: [
          { id: 'd1', path: 'items/d1', data: { x: 1 } },
          { id: 'd2', path: 'items/d2', data: { x: 2 } },
        ],
        nextPageToken: null,
      });
      const db = createDbApi();
      const docs = await db.collection('items').get();
      expect(docs).toHaveLength(2);
      expect(docs[0]).toEqual({ id: 'd1', path: 'items/d1', data: { x: 1 } });
    });

    it('supports subcollection paths', async () => {
      mockInvoke.mockResolvedValueOnce({ documents: [], nextPageToken: null });
      const db = createDbApi();
      await db.collection('users/abc/orders').get();
      expect(mockInvoke).toHaveBeenCalledWith('list_documents', {
        collectionPath: 'users/abc/orders',
        pageSize: 100,
        pageToken: null,
      });
    });
  });

  describe('executeScript', () => {
    it('captures console.log output', async () => {
      const logs: { type: string; content: string }[] = [];
      const db = createDbApi();
      await executeScript('console.log("hello", "world")', db, (type, content) => {
        logs.push({ type, content });
      });
      expect(logs).toEqual([{ type: 'log', content: 'hello world' }]);
    });

    it('captures console.error output', async () => {
      const logs: { type: string; content: string }[] = [];
      const db = createDbApi();
      await executeScript('console.error("bad")', db, (type, content) => {
        logs.push({ type, content });
      });
      expect(logs).toEqual([{ type: 'error', content: 'bad' }]);
    });

    it('returns the result of the last expression', async () => {
      const db = createDbApi();
      const result = await executeScript('1 + 2', db, () => {});
      expect(result).toBe(3);
    });

    it('handles syntax errors gracefully', async () => {
      const db = createDbApi();
      await expect(executeScript('const x = {', db, () => {})).rejects.toThrow();
    });

    it('handles runtime errors gracefully', async () => {
      const db = createDbApi();
      await expect(executeScript('throw new Error("oops")', db, () => {})).rejects.toThrow('oops');
    });

    it('can use await with db calls', async () => {
      mockInvoke.mockResolvedValueOnce({ documents: [{ id: 'a', path: 'x/a', data: {} }], nextPageToken: null });
      const logs: { type: string; content: string }[] = [];
      const db = createDbApi();
      await executeScript(
        'const docs = await db.collection("x").get(); console.log(docs.length)',
        db,
        (type, content) => logs.push({ type, content }),
      );
      expect(logs).toEqual([{ type: 'log', content: '1' }]);
    });

    it('supports console.warn as log type', async () => {
      const logs: { type: string; content: string }[] = [];
      const db = createDbApi();
      await executeScript('console.warn("caution")', db, (type, content) => {
        logs.push({ type, content });
      });
      expect(logs).toEqual([{ type: 'log', content: 'caution' }]);
    });
  });
});
