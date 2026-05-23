import { create } from 'zustand';

export type PaletteMode = 'default' | 'goto' | 'open-tab';

type PaletteStore = {
  isOpen: boolean;
  query: string;
  mode: PaletteMode;
  open: (mode?: PaletteMode) => void;
  close: () => void;
  setQuery: (query: string) => void;
};

export const usePaletteStore = create<PaletteStore>((set) => ({
  isOpen: false,
  query: '',
  mode: 'default',
  open: (mode = 'default') => set({ isOpen: true, mode, query: mode === 'goto' ? '/' : '' }),
  close: () => set({ isOpen: false }),
  setQuery: (query) => set({ query }),
}));
