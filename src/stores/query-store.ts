import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { QuerySpec, SavedQuery } from '@/types/firestore';

type QueryStore = {
  queries: SavedQuery[];
  saveQuery: (name: string, spec: QuerySpec) => void;
  deleteQuery: (id: string) => void;
  getQueriesForCollection: (collectionPath: string) => SavedQuery[];
};

export const useQueryStore = create<QueryStore>()(
  persist(
    (set, get) => ({
      queries: [],
      saveQuery(name, spec) {
        const query: SavedQuery = {
          id: crypto.randomUUID(),
          name,
          collectionPath: spec.collectionPath,
          filters: spec.filters,
          orderBy: spec.orderBy,
          limit: spec.limit,
          createdAt: Date.now(),
        };
        set((state) => ({ queries: [...state.queries, query] }));
      },
      deleteQuery(id) {
        set((state) => ({ queries: state.queries.filter((q) => q.id !== id) }));
      },
      getQueriesForCollection(collectionPath) {
        return get().queries.filter((q) => q.collectionPath === collectionPath);
      },
    }),
    { name: 'query-store' },
  ),
);
