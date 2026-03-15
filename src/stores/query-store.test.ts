import { describe, it, expect, beforeEach } from 'vitest';

import { useQueryStore } from '@/stores/query-store';

beforeEach(() => {
  useQueryStore.setState({ queries: [] });
});

describe('useQueryStore', () => {
  describe('initial state', () => {
    it('starts with empty queries', () => {
      expect(useQueryStore.getState().queries).toEqual([]);
    });
  });

  describe('saveQuery', () => {
    it('saves a query with generated id and timestamp', () => {
      useQueryStore.getState().saveQuery('My Query', {
        collectionPath: 'users',
        filters: [{ field: 'age', operator: '>=', value: 18 }],
        orderBy: [],
      });

      const queries = useQueryStore.getState().queries;
      expect(queries).toHaveLength(1);
      expect(queries[0].name).toBe('My Query');
      expect(queries[0].collectionPath).toBe('users');
      expect(queries[0].filters).toEqual([{ field: 'age', operator: '>=', value: 18 }]);
      expect(queries[0].orderBy).toEqual([]);
      expect(queries[0].id).toBeTruthy();
      expect(queries[0].createdAt).toBeGreaterThan(0);
    });

    it('saves multiple queries', () => {
      const store = useQueryStore.getState();
      store.saveQuery('Query 1', { collectionPath: 'users', filters: [], orderBy: [] });
      store.saveQuery('Query 2', { collectionPath: 'posts', filters: [], orderBy: [] });

      expect(useQueryStore.getState().queries).toHaveLength(2);
    });

    it('preserves limit in saved query', () => {
      useQueryStore.getState().saveQuery('Limited', {
        collectionPath: 'users',
        filters: [],
        orderBy: [],
        limit: 50,
      });

      expect(useQueryStore.getState().queries[0].limit).toBe(50);
    });
  });

  describe('deleteQuery', () => {
    it('deletes a query by id', () => {
      useQueryStore.getState().saveQuery('To Delete', {
        collectionPath: 'users',
        filters: [],
        orderBy: [],
      });
      const id = useQueryStore.getState().queries[0].id;

      useQueryStore.getState().deleteQuery(id);
      expect(useQueryStore.getState().queries).toHaveLength(0);
    });

    it('only deletes the matching query', () => {
      const store = useQueryStore.getState();
      store.saveQuery('Keep', { collectionPath: 'users', filters: [], orderBy: [] });
      store.saveQuery('Delete', { collectionPath: 'posts', filters: [], orderBy: [] });

      const deleteId = useQueryStore.getState().queries[1].id;
      useQueryStore.getState().deleteQuery(deleteId);

      const remaining = useQueryStore.getState().queries;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('Keep');
    });

    it('does nothing for non-existent id', () => {
      useQueryStore.getState().saveQuery('Stay', {
        collectionPath: 'users',
        filters: [],
        orderBy: [],
      });
      useQueryStore.getState().deleteQuery('non-existent');
      expect(useQueryStore.getState().queries).toHaveLength(1);
    });
  });

  describe('getQueriesForCollection', () => {
    it('returns queries matching collection path', () => {
      const store = useQueryStore.getState();
      store.saveQuery('Users Q', { collectionPath: 'users', filters: [], orderBy: [] });
      store.saveQuery('Posts Q', { collectionPath: 'posts', filters: [], orderBy: [] });
      store.saveQuery('Users Q2', { collectionPath: 'users', filters: [], orderBy: [] });

      const result = useQueryStore.getState().getQueriesForCollection('users');
      expect(result).toHaveLength(2);
      expect(result.every((q) => q.collectionPath === 'users')).toBe(true);
    });

    it('returns empty array for no matches', () => {
      useQueryStore.getState().saveQuery('Q', { collectionPath: 'users', filters: [], orderBy: [] });
      const result = useQueryStore.getState().getQueriesForCollection('orders');
      expect(result).toEqual([]);
    });
  });
});
