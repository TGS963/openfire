import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const CAP = 15;

type RecentsStore = {
  recent: string[];
  pushRecent: (path: string) => void;
  clear: () => void;
};

export const useRecentsStore = create<RecentsStore>()(
  persist(
    (set, get) => ({
      recent: [],
      pushRecent: (path) => {
        const next = [path, ...get().recent.filter((p) => p !== path)].slice(0, CAP);
        set({ recent: next });
      },
      clear: () => set({ recent: [] }),
    }),
    { name: 'recents-store' },
  ),
);
