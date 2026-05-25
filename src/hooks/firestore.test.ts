import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useDeleteDocument, useDocumentCount } from '@/hooks/firestore';
import { countDocuments } from '@/lib/tauri';
import { useAuthStore } from '@/stores/auth-store';
import { useConnectionStore } from '@/stores/connection-store';

vi.mock('@/lib/tauri', () => ({
  deleteDocument: vi.fn().mockResolvedValue(undefined),
  deleteCollection: vi.fn(),
  getDocument: vi.fn(),
  listCollections: vi.fn(),
  listDocuments: vi.fn(),
  queryDocuments: vi.fn(),
  countDocuments: vi.fn(),
}));

const KEY = 'conn-1';

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe('useDeleteDocument', () => {
  beforeEach(() => {
    useAuthStore.setState({ activeAccountId: null, connectionMode: 'production' });
    useConnectionStore.setState({ activeConnectionId: KEY });
  });

  it('invalidates queryDocuments cache on success', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    // Seed two queryDocuments cache entries under the same connection key —
    // different filter specs. Both must be invalidated after delete.
    const specA = { collectionPath: 'users', filters: [], orderBy: [] };
    const specB = { collectionPath: 'users', filters: [{ field: 'age', op: '==', value: 30 }], orderBy: [] };
    client.setQueryData(['queryDocuments', KEY, specA], { documents: [], nextPageToken: null });
    client.setQueryData(['queryDocuments', KEY, specB], { documents: [], nextPageToken: null });

    const { result } = renderHook(() => useDeleteDocument(), { wrapper: makeWrapper(client) });

    await result.current.mutateAsync('users/abc');

    await waitFor(() => {
      const a = client.getQueryState(['queryDocuments', KEY, specA]);
      const b = client.getQueryState(['queryDocuments', KEY, specB]);
      expect(a?.isInvalidated).toBe(true);
      expect(b?.isInvalidated).toBe(true);
    });
  });

  it('invalidates documentsInf and removes single-doc cache', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    client.setQueryData(['documentsInf', KEY, 'users', 100], { pages: [], pageParams: [] });
    client.setQueryData(['document', KEY, 'users/abc'], { id: 'abc', path: 'users/abc', data: {} });

    const { result } = renderHook(() => useDeleteDocument(), { wrapper: makeWrapper(client) });

    await result.current.mutateAsync('users/abc');

    await waitFor(() => {
      const inf = client.getQueryState(['documentsInf', KEY, 'users', 100]);
      expect(inf?.isInvalidated).toBe(true);
      expect(client.getQueryData(['document', KEY, 'users/abc'])).toBeUndefined();
    });
  });

  it('removes the cached docCount so the chip reverts to clickable', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['docCount', KEY, 'users'], 300);

    const { result } = renderHook(() => useDeleteDocument(), { wrapper: makeWrapper(client) });
    await result.current.mutateAsync('users/abc');

    await waitFor(() => {
      expect(client.getQueryData(['docCount', KEY, 'users'])).toBeUndefined();
    });
  });
});

describe('useDocumentCount', () => {
  beforeEach(() => {
    useAuthStore.setState({ activeAccountId: null, connectionMode: 'production' });
    useConnectionStore.setState({ activeConnectionId: KEY });
    vi.mocked(countDocuments).mockReset();
  });

  it('does not fetch until refetch is called (click-triggered)', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.mocked(countDocuments).mockResolvedValue(12840);

    const { result } = renderHook(() => useDocumentCount('users'), { wrapper: makeWrapper(client) });

    expect(countDocuments).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();

    await result.current.refetch();

    await waitFor(() => expect(result.current.data).toBe(12840));
    expect(countDocuments).toHaveBeenCalledWith('users');
  });
});
