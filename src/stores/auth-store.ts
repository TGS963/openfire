import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getErrorMessage } from '@/lib/error-utils';
import {
  connectEmulator,
  disconnectEmulator,
  importServiceAccount,
  listServiceAccounts,
  setActiveAccount,
} from '@/lib/tauri';
import { useConnectionStore } from '@/stores/connection-store';
import type { ServiceAccountSummary } from '@/types/firestore';

type ConnectionMode = 'production' | 'emulator' | null;

type AuthStore = {
  accounts: ServiceAccountSummary[];
  activeAccountId: string | null;
  isLoading: boolean;
  initialized: boolean;
  error: string | null;
  connectionMode: ConnectionMode;
  emulatorUrl: string | null;
  emulatorProjectId: string | null;
  loadAccounts: () => Promise<void>;
  importAccount: (filePath: string) => Promise<void>;
  selectAccount: (id: string) => Promise<void>;
  connectToEmulator: (projectId: string, url: string) => Promise<void>;
  disconnectFromEmulator: () => Promise<void>;
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
      connectionMode: null,
      emulatorUrl: null,
      emulatorProjectId: null,
      async loadAccounts() {
        set((state) => ({ isLoading: state.accounts.length === 0, error: null }));
        try {
          const accounts = await listServiceAccounts();
          const persistedId = get().activeAccountId;
          const autoSelectId =
            persistedId && accounts.some((acc) => acc.id === persistedId)
              ? persistedId
              : accounts.length === 1
                ? accounts[0].id
                : null;
          set({
            accounts,
            activeAccountId: autoSelectId,
            initialized: true,
            isLoading: false,
          });
          if (autoSelectId && get().connectionMode !== 'emulator') {
            try {
              await get().selectAccount(autoSelectId);
            } catch {
              // selectAccount sets its own error; loadAccounts already initialized.
            }
          }
        } catch (error) {
          set({
            error: getErrorMessage(error, 'Unable to load accounts'),
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
            error: getErrorMessage(error, 'Unable to import account'),
            isLoading: false,
          });
          throw error;
        }
      },
      async selectAccount(id: string) {
        set({ isLoading: true, error: null });
        try {
          await setActiveAccount(id);
          set({
            activeAccountId: id,
            connectionMode: 'production',
            emulatorUrl: null,
            emulatorProjectId: null,
            isLoading: false,
          });
          useConnectionStore.getState().loadConnections();
        } catch (error) {
          set({
            error: getErrorMessage(error, 'Unable to switch account'),
            activeAccountId: null,
            isLoading: false,
          });
          throw error;
        }
      },
      async connectToEmulator(projectId: string, url: string) {
        set({ isLoading: true, error: null });
        try {
          await connectEmulator(projectId, url);
          set({
            connectionMode: 'emulator',
            emulatorUrl: url,
            emulatorProjectId: projectId,
            activeAccountId: null,
            isLoading: false,
          });
          useConnectionStore.getState().loadConnections();
        } catch (error) {
          set({
            error: getErrorMessage(error, 'Unable to connect to emulator'),
            isLoading: false,
          });
          throw error;
        }
      },
      async disconnectFromEmulator() {
        set({ isLoading: true, error: null });
        try {
          await disconnectEmulator();
          set({
            connectionMode: null,
            emulatorUrl: null,
            emulatorProjectId: null,
            isLoading: false,
          });
          useConnectionStore.getState().loadConnections();
        } catch (error) {
          set({
            error: getErrorMessage(error, 'Unable to disconnect'),
            isLoading: false,
          });
        }
      },
      clearError() {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ activeAccountId: state.activeAccountId }),
    },
  ),
);
