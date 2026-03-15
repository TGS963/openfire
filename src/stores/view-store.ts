import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ListMode = 'list' | 'table';
export type PreviewMode = 'json' | 'fields';
export type Theme = 'dark' | 'light';

type ViewStore = {
  listMode: ListMode;
  previewMode: PreviewMode;
  theme: Theme;
  setListMode: (mode: ListMode) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  toggleTheme: () => void;
};

export const useViewStore = create<ViewStore>()(
  persist(
    (set) => ({
      listMode: 'list',
      previewMode: 'json',
      theme: 'dark',
      setListMode: (listMode) => set({ listMode }),
      setPreviewMode: (previewMode) => set({ previewMode }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'view-store',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
