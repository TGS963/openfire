import { create } from 'zustand';

type NavStore = {
  collectionPath: string | null;
  documentPath: string | null;
  setCollectionPath: (path: string | null) => void;
  setDocumentPath: (path: string | null) => void;
  reset: () => void;
};

export const useNavStore = create<NavStore>((set) => ({
  collectionPath: null,
  documentPath: null,
  setCollectionPath: (path) =>
    set({
      collectionPath: path,
      documentPath: null,
    }),
  setDocumentPath: (path) => set({ documentPath: path }),
  reset: () => set({ collectionPath: null, documentPath: null }),
}));
