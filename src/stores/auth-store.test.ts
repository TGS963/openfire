import { invoke } from '@tauri-apps/api/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAuthStore } from '@/stores/auth-store';
import { useConnectionStore } from '@/stores/connection-store';

const mockedInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
  // Reset connection store
  useConnectionStore.setState({
    connections: [],
    activeConnectionId: null,
    isLoading: false,
    error: null,
  });
  // Reset store to initial state
  useAuthStore.setState({
    accounts: [],
    activeAccountId: null,
    isLoading: false,
    initialized: false,
    error: null,
    connectionError: null,
    connectionMode: null,
    emulatorUrl: null,
    emulatorProjectId: null,
  });
});

describe('useAuthStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = useAuthStore.getState();
      expect(state.accounts).toEqual([]);
      expect(state.activeAccountId).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.initialized).toBe(false);
      expect(state.error).toBeNull();
      expect(state.connectionMode).toBeNull();
      expect(state.emulatorUrl).toBeNull();
      expect(state.emulatorProjectId).toBeNull();
    });
  });

  describe('loadAccounts', () => {
    it('loads accounts from backend', async () => {
      const accounts = [
        { id: '1', projectId: 'proj-1', clientEmail: 'a@b.com' },
        { id: '2', projectId: 'proj-2', clientEmail: 'c@d.com' },
      ];
      mockedInvoke.mockResolvedValueOnce(accounts);

      await useAuthStore.getState().loadAccounts();

      const state = useAuthStore.getState();
      expect(state.accounts).toEqual(accounts);
      expect(state.initialized).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.activeAccountId).toBeNull();
    });

    it('sets error on failure', async () => {
      mockedInvoke.mockRejectedValueOnce(new Error('Network error'));

      await useAuthStore.getState().loadAccounts();

      const state = useAuthStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.initialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('importAccount', () => {
    it('imports account and selects it', async () => {
      const summary = { id: 'new-1', projectId: 'new-proj', clientEmail: 'new@b.com' };
      // import_service_account, set_active_account, list_connections (from loadConnections)
      mockedInvoke.mockResolvedValueOnce(summary).mockResolvedValueOnce(summary).mockResolvedValueOnce([]);

      await useAuthStore.getState().importAccount('/path/to/key.json');

      const state = useAuthStore.getState();
      expect(state.accounts).toContainEqual(summary);
      expect(state.activeAccountId).toBe('new-1');
      expect(state.connectionMode).toBe('production');
    });

    it('sets error on failure', async () => {
      mockedInvoke.mockRejectedValueOnce(new Error('Invalid file'));

      await expect(
        useAuthStore.getState().importAccount('/bad/path.json'),
      ).rejects.toThrow('Invalid file');

      expect(useAuthStore.getState().error).toBe('Invalid file');
    });
  });

  describe('selectAccount', () => {
    it('sets active account and production mode', async () => {
      mockedInvoke.mockResolvedValueOnce({ id: 'acc1', projectId: 'proj', clientEmail: 'a@b.com' }).mockResolvedValueOnce([]);

      await useAuthStore.getState().selectAccount('acc1');

      const state = useAuthStore.getState();
      expect(state.activeAccountId).toBe('acc1');
      expect(state.connectionMode).toBe('production');
      expect(state.emulatorUrl).toBeNull();
      expect(state.emulatorProjectId).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('clears emulator state when switching to production', async () => {
      // Start in emulator mode
      useAuthStore.setState({
        connectionMode: 'emulator',
        emulatorUrl: 'http://localhost:8080',
        emulatorProjectId: 'emu-proj',
      });

      mockedInvoke.mockResolvedValueOnce({ id: 'acc1', projectId: 'proj', clientEmail: 'a@b.com' }).mockResolvedValueOnce([]);

      await useAuthStore.getState().selectAccount('acc1');

      const state = useAuthStore.getState();
      expect(state.connectionMode).toBe('production');
      expect(state.emulatorUrl).toBeNull();
      expect(state.emulatorProjectId).toBeNull();
    });

    it('sets error and throws on failure', async () => {
      mockedInvoke.mockRejectedValueOnce(new Error('Auth failed'));

      await expect(useAuthStore.getState().selectAccount('bad-id')).rejects.toThrow('Auth failed');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Auth failed');
      expect(state.activeAccountId).toBeNull();
    });
  });

  describe('connectToEmulator', () => {
    it('connects to emulator and updates state', async () => {
      const info = { mode: 'emulator', projectId: 'emu-proj', emulatorUrl: 'http://localhost:8080' };
      mockedInvoke.mockResolvedValueOnce(info).mockResolvedValueOnce([]);

      await useAuthStore.getState().connectToEmulator('emu-proj', 'http://localhost:8080');

      const state = useAuthStore.getState();
      expect(state.connectionMode).toBe('emulator');
      expect(state.emulatorUrl).toBe('http://localhost:8080');
      expect(state.emulatorProjectId).toBe('emu-proj');
      expect(state.activeAccountId).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('clears active account when connecting to emulator', async () => {
      useAuthStore.setState({ activeAccountId: 'acc1', connectionMode: 'production' });
      mockedInvoke.mockResolvedValueOnce({ mode: 'emulator', projectId: 'p', emulatorUrl: 'http://localhost:8080' }).mockResolvedValueOnce([]);

      await useAuthStore.getState().connectToEmulator('p', 'http://localhost:8080');

      expect(useAuthStore.getState().activeAccountId).toBeNull();
    });

    it('sets error and throws on failure', async () => {
      mockedInvoke.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        useAuthStore.getState().connectToEmulator('proj', 'http://bad:9999'),
      ).rejects.toThrow('Connection refused');

      expect(useAuthStore.getState().error).toBe('Connection refused');
      expect(useAuthStore.getState().connectionMode).toBeNull();
    });
  });

  describe('disconnectFromEmulator', () => {
    it('disconnects and clears emulator state', async () => {
      useAuthStore.setState({
        connectionMode: 'emulator',
        emulatorUrl: 'http://localhost:8080',
        emulatorProjectId: 'emu-proj',
      });
      mockedInvoke.mockResolvedValueOnce(undefined).mockResolvedValueOnce([]);

      await useAuthStore.getState().disconnectFromEmulator();

      const state = useAuthStore.getState();
      expect(state.connectionMode).toBeNull();
      expect(state.emulatorUrl).toBeNull();
      expect(state.emulatorProjectId).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      useAuthStore.setState({ connectionMode: 'emulator' });
      mockedInvoke.mockRejectedValueOnce(new Error('Disconnect failed'));

      await useAuthStore.getState().disconnectFromEmulator();

      expect(useAuthStore.getState().error).toBe('Disconnect failed');
    });
  });

  describe('validateActiveAccount', () => {
    it('clears a stale connectionError when the probe succeeds', async () => {
      useAuthStore.setState({
        connectionMode: 'production',
        activeAccountId: 'acc1',
        connectionError: 'creds revoked',
      });
      mockedInvoke.mockResolvedValueOnce({ id: 'acc1', projectId: 'proj', clientEmail: 'a@b.com' });

      await useAuthStore.getState().validateActiveAccount();

      expect(useAuthStore.getState().connectionError).toBeNull();
    });

    it('sets connectionError when the probe fails', async () => {
      useAuthStore.setState({ connectionMode: 'production', activeAccountId: 'acc1' });
      mockedInvoke.mockRejectedValueOnce(new Error('Service account invalid'));

      await useAuthStore.getState().validateActiveAccount();

      const state = useAuthStore.getState();
      expect(state.connectionError).toBe('Service account invalid');
      expect(state.connectionMode).toBe('production');
    });

    it('pings the emulator and clears connectionError on success', async () => {
      useAuthStore.setState({ connectionMode: 'emulator', connectionError: 'stale' });
      mockedInvoke.mockResolvedValueOnce(undefined);

      await useAuthStore.getState().validateActiveAccount();

      expect(mockedInvoke).toHaveBeenCalledWith('ping_connection');
      expect(useAuthStore.getState().connectionError).toBeNull();
    });

    it('sets connectionError when the emulator ping fails', async () => {
      useAuthStore.setState({ connectionMode: 'emulator' });
      mockedInvoke.mockRejectedValueOnce(new Error('Connection refused'));

      await useAuthStore.getState().validateActiveAccount();

      expect(useAuthStore.getState().connectionError).toBe('Connection refused');
      expect(useAuthStore.getState().connectionMode).toBe('emulator');
    });

    it('is a no-op with no active connection', async () => {
      useAuthStore.setState({ connectionMode: null });
      await useAuthStore.getState().validateActiveAccount();
      expect(mockedInvoke).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('clears the error', () => {
      useAuthStore.setState({ error: 'Something went wrong' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('clears every connection marker the rest of the app reads', () => {
      useAuthStore.setState({
        accounts: [{ id: 'acc1', projectId: 'proj', clientEmail: 'a@b.com' }],
        initialized: true,
        activeAccountId: 'acc1',
        connectionMode: 'production',
        connectionError: 'stale',
        emulatorUrl: 'http://localhost:8080',
        emulatorProjectId: 'emu-proj',
      });

      useAuthStore.getState().disconnect();

      const state = useAuthStore.getState();
      expect(state.activeAccountId).toBeNull();
      expect(state.connectionMode).toBeNull();
      expect(state.connectionError).toBeNull();
      expect(state.emulatorUrl).toBeNull();
      expect(state.emulatorProjectId).toBeNull();
    });

    it('leaves the account list and initialized flag untouched', () => {
      const accounts = [{ id: 'acc1', projectId: 'proj', clientEmail: 'a@b.com' }];
      useAuthStore.setState({
        accounts,
        initialized: true,
        activeAccountId: 'acc1',
        connectionMode: 'production',
      });

      useAuthStore.getState().disconnect();

      const state = useAuthStore.getState();
      expect(state.accounts).toEqual(accounts);
      expect(state.initialized).toBe(true);
    });

    it('is idempotent — calling on an already-disconnected store is a no-op', () => {
      const before = useAuthStore.getState();
      useAuthStore.getState().disconnect();
      const after = useAuthStore.getState();
      expect(after.activeAccountId).toBe(before.activeAccountId);
      expect(after.connectionMode).toBe(before.connectionMode);
    });
  });

  describe('disconnectFromEmulator (post-refactor regression)', () => {
    it('ends in the same disconnected state as disconnect()', async () => {
      useAuthStore.setState({
        connectionMode: 'emulator',
        emulatorUrl: 'http://localhost:8080',
        emulatorProjectId: 'emu-proj',
        connectionError: 'stale',
        activeAccountId: null,
      });
      mockedInvoke.mockResolvedValueOnce(undefined).mockResolvedValueOnce([]);

      await useAuthStore.getState().disconnectFromEmulator();

      const state = useAuthStore.getState();
      expect(state.connectionMode).toBeNull();
      expect(state.emulatorUrl).toBeNull();
      expect(state.emulatorProjectId).toBeNull();
      expect(state.connectionError).toBeNull();
      expect(state.activeAccountId).toBeNull();
    });
  });
});
