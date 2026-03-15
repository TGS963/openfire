import { create } from 'zustand';

import { getErrorMessage } from '@/lib/error-utils';
import { listConnections, removeConnection, setActiveConnection } from '@/lib/tauri';
import type { ConnectionEntry } from '@/types/firestore';

type ConnectionStore = {
  connections: ConnectionEntry[];
  activeConnectionId: string | null;
  isLoading: boolean;
  error: string | null;
  loadConnections: () => Promise<void>;
  removeConnection: (id: string) => Promise<void>;
  switchConnection: (id: string) => Promise<void>;
  clearError: () => void;
};

export const useConnectionStore = create<ConnectionStore>()((set, get) => ({
  connections: [],
  activeConnectionId: null,
  isLoading: false,
  error: null,

  async loadConnections() {
    set({ isLoading: true, error: null });
    try {
      const entries = await listConnections();
      const active = entries.find((e) => e.isActive);
      set({
        connections: entries,
        activeConnectionId: active?.id ?? null,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: getErrorMessage(err),
      });
    }
  },

  async removeConnection(id: string) {
    try {
      await removeConnection(id);
      await get().loadConnections();
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  async switchConnection(id: string) {
    try {
      await setActiveConnection(id);
      await get().loadConnections();
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  clearError() {
    set({ error: null });
  },
}));
