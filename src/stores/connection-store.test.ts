import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

import { useConnectionStore } from '@/stores/connection-store';

const mockedInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
  useConnectionStore.setState({
    connections: [],
    activeConnectionId: null,
    isLoading: false,
    error: null,
  });
});

describe('connection-store', () => {
  it('has correct initial state', () => {
    const state = useConnectionStore.getState();
    expect(state.connections).toEqual([]);
    expect(state.activeConnectionId).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('loadConnections fetches and sets connections', async () => {
    const entries = [
      { id: 'prod-proj', mode: { type: 'production' }, isActive: true },
      { id: 'emu-demo', mode: { type: 'emulator', url: 'http://localhost:8080', project_id: 'demo' }, isActive: false },
    ];
    mockedInvoke.mockResolvedValueOnce(entries);

    await useConnectionStore.getState().loadConnections();

    const state = useConnectionStore.getState();
    expect(state.connections).toEqual(entries);
    expect(state.activeConnectionId).toBe('prod-proj');
    expect(state.isLoading).toBe(false);
  });

  it('loadConnections sets activeConnectionId to null when no active connection', async () => {
    const entries = [
      { id: 'prod-proj', mode: { type: 'production' }, isActive: false },
    ];
    mockedInvoke.mockResolvedValueOnce(entries);

    await useConnectionStore.getState().loadConnections();

    expect(useConnectionStore.getState().activeConnectionId).toBeNull();
  });

  it('loadConnections sets error on failure', async () => {
    mockedInvoke.mockRejectedValueOnce(new Error('Network error'));

    await useConnectionStore.getState().loadConnections();

    const state = useConnectionStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.isLoading).toBe(false);
  });

  it('removeConnection calls IPC and reloads', async () => {
    // Set initial state
    useConnectionStore.setState({
      connections: [
        { id: 'prod-proj', mode: { type: 'production' as const }, isActive: true },
        { id: 'emu-demo', mode: { type: 'emulator' as const, url: 'http://localhost:8080', project_id: 'demo' }, isActive: false },
      ],
      activeConnectionId: 'prod-proj',
    });

    // remove_connection call
    mockedInvoke.mockResolvedValueOnce(undefined);
    // list_connections reload
    mockedInvoke.mockResolvedValueOnce([
      { id: 'emu-demo', mode: { type: 'emulator', url: 'http://localhost:8080', project_id: 'demo' }, isActive: true },
    ]);

    await useConnectionStore.getState().removeConnection('prod-proj');

    expect(mockedInvoke).toHaveBeenCalledWith('remove_connection', { connectionId: 'prod-proj' });
    expect(useConnectionStore.getState().connections).toHaveLength(1);
  });

  it('removeConnection clears activeConnectionId when removing the active one', async () => {
    useConnectionStore.setState({
      connections: [
        { id: 'prod-proj', mode: { type: 'production' as const }, isActive: true },
      ],
      activeConnectionId: 'prod-proj',
    });

    // remove_connection then list_connections (empty — backend dropped it).
    mockedInvoke.mockResolvedValueOnce(undefined).mockResolvedValueOnce([]);

    await useConnectionStore.getState().removeConnection('prod-proj');

    expect(useConnectionStore.getState().activeConnectionId).toBeNull();
    expect(useConnectionStore.getState().connections).toEqual([]);
  });

  it('switchConnection calls IPC and reloads', async () => {
    // set_active_connection call
    mockedInvoke.mockResolvedValueOnce(undefined);
    // list_connections reload
    mockedInvoke.mockResolvedValueOnce([
      { id: 'prod-proj', mode: { type: 'production' }, isActive: false },
      { id: 'emu-demo', mode: { type: 'emulator', url: 'http://localhost:8080', project_id: 'demo' }, isActive: true },
    ]);

    await useConnectionStore.getState().switchConnection('emu-demo');

    expect(mockedInvoke).toHaveBeenCalledWith('set_active_connection', { connectionId: 'emu-demo' });
    expect(useConnectionStore.getState().activeConnectionId).toBe('emu-demo');
  });

  it('switchConnection sets error on failure', async () => {
    mockedInvoke.mockRejectedValueOnce(new Error('Connection not found'));

    await useConnectionStore.getState().switchConnection('bad-id');

    expect(useConnectionStore.getState().error).toBe('Connection not found');
  });

  it('clearError resets error to null', () => {
    useConnectionStore.setState({ error: 'some error' });
    useConnectionStore.getState().clearError();
    expect(useConnectionStore.getState().error).toBeNull();
  });
});
