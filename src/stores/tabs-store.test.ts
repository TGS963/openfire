import { describe, it, expect, beforeEach } from 'vitest';

import { useTabsStore } from '@/stores/tabs-store';
import { useNavStore } from '@/stores/nav-store';

beforeEach(() => {
  useTabsStore.setState({ tabs: [], activeId: null, accountId: null });
  useNavStore.getState().reset();
});

const tabs = () => useTabsStore.getState().tabs;
const active = () => useTabsStore.getState().activeId;

describe('useTabsStore', () => {
  describe('openCollection', () => {
    it('appends and activates a collection tab and hydrates nav-store', () => {
      useTabsStore.getState().openCollection('users');
      expect(tabs()).toHaveLength(1);
      expect(tabs()[0]).toMatchObject({ kind: 'collection', path: 'users', collectionPath: 'users' });
      expect(active()).toBe(tabs()[0].id);
      expect(useNavStore.getState().collectionPath).toBe('users');
      expect(useNavStore.getState().breadcrumbs).toEqual(['users']);
    });

    it('focuses an existing tab instead of duplicating', () => {
      const store = useTabsStore.getState();
      store.openCollection('users');
      store.openCollection('posts');
      store.openCollection('users');
      expect(tabs()).toHaveLength(2);
      expect(active()).toBe(tabs().find((t) => t.path === 'users')!.id);
    });

    it('opens in the background without changing the active tab', () => {
      const store = useTabsStore.getState();
      store.openCollection('users');
      const firstActive = active();
      store.openCollection('posts', { background: true });
      expect(tabs()).toHaveLength(2);
      expect(active()).toBe(firstActive);
      expect(useNavStore.getState().collectionPath).toBe('users');
    });
  });

  describe('openDocument', () => {
    it('derives collectionPath and activates a document tab', () => {
      useTabsStore.getState().openDocument('users/abc123');
      const tab = tabs()[0];
      expect(tab).toMatchObject({ kind: 'document', path: 'users/abc123', documentPath: 'users/abc123', collectionPath: 'users' });
      expect(useNavStore.getState().documentPath).toBe('users/abc123');
      expect(useNavStore.getState().collectionPath).toBe('users');
    });
  });

  describe('setActive', () => {
    it('snapshots the outgoing tab nav and hydrates the incoming tab', () => {
      const store = useTabsStore.getState();
      store.openCollection('users');
      const usersId = active()!;
      store.openCollection('posts');
      // mutate nav while on posts
      useNavStore.getState().setDocumentPath('posts/p1');
      store.setActive(usersId);
      // back on users → its nav restored
      expect(useNavStore.getState().collectionPath).toBe('users');
      expect(useNavStore.getState().documentPath).toBeNull();
      // posts tab kept its snapshot
      const postsTab = tabs().find((t) => t.path === 'posts')!;
      expect(postsTab.documentPath).toBe('posts/p1');
    });
  });

  describe('closeTab', () => {
    it('activates a neighbor when the active tab is closed', () => {
      const store = useTabsStore.getState();
      store.openCollection('users');
      store.openCollection('posts');
      const postsId = active()!;
      store.closeTab(postsId);
      expect(tabs()).toHaveLength(1);
      expect(active()).toBe(tabs()[0].id);
      expect(useNavStore.getState().collectionPath).toBe('users');
    });

    it('resets nav when the last tab is closed', () => {
      const store = useTabsStore.getState();
      store.openCollection('users');
      store.closeTab(active()!);
      expect(tabs()).toHaveLength(0);
      expect(active()).toBeNull();
      expect(useNavStore.getState().collectionPath).toBeNull();
    });

    it('removes a non-active tab without changing the active one', () => {
      const store = useTabsStore.getState();
      store.openCollection('users');
      store.openCollection('posts');
      const usersId = tabs().find((t) => t.path === 'users')!.id;
      const postsId = active()!;
      store.closeTab(usersId);
      expect(active()).toBe(postsId);
    });
  });

  describe('closeTabByPath', () => {
    it('closes the tab matching a document path', () => {
      const store = useTabsStore.getState();
      store.openCollection('users');
      store.openDocument('users/abc');
      store.closeTabByPath('users/abc');
      expect(tabs().some((t) => t.path === 'users/abc')).toBe(false);
      expect(tabs()).toHaveLength(1);
    });

    it('is a no-op for an unknown path', () => {
      const store = useTabsStore.getState();
      store.openCollection('users');
      store.closeTabByPath('users/nope');
      expect(tabs()).toHaveLength(1);
    });
  });

  describe('setDirty', () => {
    it('flags a tab dirty', () => {
      const store = useTabsStore.getState();
      store.openDocument('users/abc');
      store.setDirty(active()!, true);
      expect(tabs()[0].dirty).toBe(true);
    });
  });

  describe('reorder', () => {
    it('moves a tab from one index to another', () => {
      const store = useTabsStore.getState();
      store.openCollection('a');
      store.openCollection('b');
      store.openCollection('c');
      store.reorder(0, 2);
      expect(tabs().map((t) => t.path)).toEqual(['b', 'c', 'a']);
    });
  });

  describe('reset', () => {
    it('clears all tabs', () => {
      const store = useTabsStore.getState();
      store.openCollection('users');
      store.reset();
      expect(tabs()).toHaveLength(0);
      expect(active()).toBeNull();
    });
  });

  describe('ensureAccount', () => {
    it('is a no-op when the account matches (preserves tabs)', () => {
      const store = useTabsStore.getState();
      store.ensureAccount('acct-1');
      store.openCollection('users');
      const reset = useTabsStore.getState().ensureAccount('acct-1');
      expect(reset).toBe(false);
      expect(tabs()).toHaveLength(1);
    });

    it('clears tabs when switching to a different account', () => {
      const store = useTabsStore.getState();
      store.ensureAccount('acct-1');
      store.openCollection('users');
      const reset = useTabsStore.getState().ensureAccount('acct-2');
      expect(reset).toBe(true);
      expect(tabs()).toHaveLength(0);
      expect(useNavStore.getState().collectionPath).toBeNull();
    });
  });

  describe('persistence', () => {
    it('writes tabs + activeId to localStorage', () => {
      useTabsStore.getState().openCollection('users');
      const raw = globalThis.localStorage.getItem('tabs-store');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw as string);
      expect(parsed.state.tabs).toHaveLength(1);
      expect(parsed.state.activeId).toBe(useTabsStore.getState().activeId);
    });
  });

  describe('hydrateNavFromActive', () => {
    it('pushes the active tab nav into nav-store', () => {
      const store = useTabsStore.getState();
      store.openDocument('users/x1');
      useNavStore.getState().reset();
      store.hydrateNavFromActive();
      expect(useNavStore.getState().documentPath).toBe('users/x1');
      expect(useNavStore.getState().collectionPath).toBe('users');
    });
  });
});
