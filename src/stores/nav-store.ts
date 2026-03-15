import { create } from 'zustand';

type NavStore = {
  collectionPath: string | null;
  documentPath: string | null;
  breadcrumbs: string[];
  setCollectionPath: (path: string | null) => void;
  setDocumentPath: (path: string | null) => void;
  popToBreadcrumb: (index: number) => void;
  reset: () => void;
};

export const useNavStore = create<NavStore>((set) => ({
  collectionPath: null,
  documentPath: null,
  breadcrumbs: [],
  setCollectionPath: (path) =>
    set({
      collectionPath: path,
      documentPath: null,
      breadcrumbs: path ? path.split('/') : [],
    }),
  setDocumentPath: (path) => set({ documentPath: path }),
  popToBreadcrumb: (index) =>
    set((state) => {
      const breadcrumbs = state.breadcrumbs.slice(0, index + 1);
      return {
        breadcrumbs,
        collectionPath: breadcrumbs.join('/'),
        documentPath: null,
      };
    }),
  reset: () =>
    set({ collectionPath: null, documentPath: null, breadcrumbs: [] }),
}));
