import { describe, it, expect, beforeEach } from 'vitest';
import { useNavStore } from './nav-store';

describe('nav-store', () => {
  beforeEach(() => {
    useNavStore.setState({
      collectionPath: null,
      documentPath: null,
      breadcrumbs: [],
    });
  });

  describe('initial state', () => {
    it('has null collectionPath', () => {
      expect(useNavStore.getState().collectionPath).toBeNull();
    });

    it('has null documentPath', () => {
      expect(useNavStore.getState().documentPath).toBeNull();
    });

    it('has empty breadcrumbs', () => {
      expect(useNavStore.getState().breadcrumbs).toEqual([]);
    });
  });

  describe('setCollectionPath', () => {
    it('sets collectionPath', () => {
      useNavStore.getState().setCollectionPath('users');
      expect(useNavStore.getState().collectionPath).toBe('users');
    });

    it('clears documentPath', () => {
      useNavStore.getState().setDocumentPath('users/123');
      useNavStore.getState().setCollectionPath('posts');
      expect(useNavStore.getState().documentPath).toBeNull();
    });

    it('updates breadcrumbs by splitting the path', () => {
      useNavStore.getState().setCollectionPath('users/123/posts');
      expect(useNavStore.getState().breadcrumbs).toEqual([
        'users',
        '123',
        'posts',
      ]);
    });

    it('sets breadcrumbs for a single-segment path', () => {
      useNavStore.getState().setCollectionPath('users');
      expect(useNavStore.getState().breadcrumbs).toEqual(['users']);
    });

    it('clears breadcrumbs when path is null', () => {
      useNavStore.getState().setCollectionPath('users/123');
      useNavStore.getState().setCollectionPath(null);
      expect(useNavStore.getState().breadcrumbs).toEqual([]);
    });
  });

  describe('setDocumentPath', () => {
    it('sets documentPath', () => {
      useNavStore.getState().setDocumentPath('users/123');
      expect(useNavStore.getState().documentPath).toBe('users/123');
    });

    it('does not change collectionPath', () => {
      useNavStore.getState().setCollectionPath('users');
      useNavStore.getState().setDocumentPath('users/123');
      expect(useNavStore.getState().collectionPath).toBe('users');
    });
  });

  describe('reset', () => {
    it('clears collectionPath', () => {
      useNavStore.getState().setCollectionPath('users');
      useNavStore.getState().reset();
      expect(useNavStore.getState().collectionPath).toBeNull();
    });

    it('clears documentPath', () => {
      useNavStore.getState().setDocumentPath('users/123');
      useNavStore.getState().reset();
      expect(useNavStore.getState().documentPath).toBeNull();
    });

    it('clears breadcrumbs', () => {
      useNavStore.getState().setCollectionPath('users/123/posts');
      useNavStore.getState().reset();
      expect(useNavStore.getState().breadcrumbs).toEqual([]);
    });
  });

  describe('popToBreadcrumb', () => {
    beforeEach(() => {
      useNavStore.getState().setCollectionPath('users/123/posts');
    });

    it('truncates breadcrumbs to index+1', () => {
      useNavStore.getState().popToBreadcrumb(0);
      expect(useNavStore.getState().breadcrumbs).toEqual(['users']);
    });

    it('updates collectionPath to match truncated breadcrumbs', () => {
      useNavStore.getState().popToBreadcrumb(0);
      expect(useNavStore.getState().collectionPath).toBe('users');
    });

    it('pops to middle index correctly', () => {
      useNavStore.getState().popToBreadcrumb(1);
      expect(useNavStore.getState().breadcrumbs).toEqual(['users', '123']);
      expect(useNavStore.getState().collectionPath).toBe('users/123');
    });

    it('pops to last index (no-op on breadcrumbs)', () => {
      useNavStore.getState().popToBreadcrumb(2);
      expect(useNavStore.getState().breadcrumbs).toEqual([
        'users',
        '123',
        'posts',
      ]);
      expect(useNavStore.getState().collectionPath).toBe('users/123/posts');
    });

    it('clears documentPath', () => {
      useNavStore.getState().setDocumentPath('users/123/posts/abc');
      useNavStore.getState().popToBreadcrumb(0);
      expect(useNavStore.getState().documentPath).toBeNull();
    });
  });
});
