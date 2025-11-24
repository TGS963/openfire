import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  importServiceAccount,
  listServiceAccounts,
  setActiveAccount,
} from '@/lib/tauri';
import type { ServiceAccountSummary } from '@/types/firestore';

type AuthStore = {
  accounts: ServiceAccountSummary[];
  activeAccountId: string | null;
  isLoading: boolean;
  initialized: boolean;
  error: string | null;
  loadAccounts: () => Promise<void>;
  importAccount: (filePath: string) => Promise<void>;
  selectAccount: (id: string) => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeAccountId: null,
      isLoading: false,
      initialized: false,
      error: null,
      async loadAccounts() {
        set((state) => ({ isLoading: state.accounts.length === 0, error: null }));
        try {
          const accounts = await listServiceAccounts();
          set({ accounts, activeAccountId: null, initialized: true, isLoading: false });
        } catch (error) {
          set({
            error: (error as Error)?.message ?? 'Unable to load accounts',
            initialized: true,
            isLoading: false,
          });
        }
      },
      async importAccount(filePath: string) {
        set({ isLoading: true, error: null });
        try {
          const summary = await importServiceAccount(filePath);
          set((state) => ({
            accounts: [...state.accounts.filter((acc) => acc.id !== summary.id), summary],
            isLoading: false,
          }));
          await get().selectAccount(summary.id);
        } catch (error) {
          set({
            error: (error as Error)?.message ?? 'Unable to import account',
            isLoading: false,
          });
        }
      },
      async selectAccount(id: string) {
        set({ isLoading: true, error: null });
        try {
          await setActiveAccount(id);
          set({ activeAccountId: id, isLoading: false });
        } catch (error) {
          set({
            error: (error as Error)?.message ?? 'Unable to switch account',
            activeAccountId: null,
            isLoading: false,
          });
          throw error;
        }
      },
      clearError() {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
      partialize: () => ({}),
    },
  ),
);
