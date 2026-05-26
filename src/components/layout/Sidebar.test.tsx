import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import { useViewStore } from '@/stores/view-store';
import type { ServiceAccountSummary } from '@/types/firestore';

vi.mock('@/components/collections/CollectionTree', () => ({
  CollectionTree: ({ onCreateCollection }: { onCreateCollection?: () => void }) => (
    <div data-testid="collection-tree" data-can-create={onCreateCollection ? 'yes' : 'no'} />
  ),
}));

const account: ServiceAccountSummary = {
  id: 'a1',
  projectId: 'pinion-prod',
  clientEmail: 'firebase-adminsdk@pinion-prod.iam.gserviceaccount.com',
};

const baseProps = {
  accounts: [account],
  activeAccountId: 'a1',
  isLoading: false,
  onImport: vi.fn().mockResolvedValue(undefined),
  onSelectAccount: vi.fn().mockResolvedValue(undefined),
  collectionPath: null,
  documentPath: null,
  onSelectCollection: vi.fn(),
  connectionMode: 'production' as const,
  emulatorProjectId: null,
  onConnectEmulator: vi.fn(),
  onDisconnectEmulator: vi.fn(),
  onManageConnections: vi.fn(),
};

describe('Sidebar', () => {
  beforeEach(() => {
    useViewStore.setState({ theme: 'dark' });
    vi.clearAllMocks();
  });

  it('renders the project pill with project name and email', () => {
    render(<Sidebar {...baseProps} />);
    expect(screen.getAllByText('pinion-prod').length).toBeGreaterThan(0);
    expect(screen.getByText(account.clientEmail)).toBeInTheDocument();
  });

  it('opens connection manager when the project pill is clicked', async () => {
    const user = userEvent.setup();
    const onManageConnections = vi.fn();
    render(<Sidebar {...baseProps} onManageConnections={onManageConnections} />);
    await user.click(screen.getByRole('button', { name: /pinion-prod/i }));
    expect(onManageConnections).toHaveBeenCalledTimes(1);
  });

  it('shows a header create-collection button when connected and calls the handler', async () => {
    const user = userEvent.setup();
    const onCreateCollection = vi.fn();
    render(<Sidebar {...baseProps} onCreateCollection={onCreateCollection} />);
    await user.click(screen.getByRole('button', { name: /New collection/i }));
    expect(onCreateCollection).toHaveBeenCalledTimes(1);
  });

  it('hides the header create-collection button when disconnected', () => {
    render(
      <Sidebar
        {...baseProps}
        connectionMode={null}
        activeAccountId={null}
        accounts={[]}
        onCreateCollection={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /New collection/i })).not.toBeInTheDocument();
  });

  it('does not pass onCreateCollection to the tree when disconnected', () => {
    render(
      <Sidebar
        {...baseProps}
        connectionMode={null}
        activeAccountId={null}
        accounts={[]}
        onCreateCollection={vi.fn()}
      />,
    );
    expect(screen.getByTestId('collection-tree')).toHaveAttribute('data-can-create', 'no');
  });

  it('passes onCreateCollection to the tree when connected', () => {
    render(<Sidebar {...baseProps} onCreateCollection={vi.fn()} />);
    expect(screen.getByTestId('collection-tree')).toHaveAttribute('data-can-create', 'yes');
  });

  it('shows an emulator status indicator in emulator mode', () => {
    render(
      <Sidebar
        {...baseProps}
        connectionMode="emulator"
        emulatorProjectId="demo-app"
        activeAccountId={null}
        accounts={[]}
      />,
    );
    expect(screen.getAllByText('demo-app').length).toBeGreaterThan(0);
    expect(screen.getByTestId('connection-dot')).toHaveAttribute('data-mode', 'emulator');
  });

  it('shows a disconnected status indicator when nothing is connected', () => {
    render(
      <Sidebar
        {...baseProps}
        connectionMode={null}
        activeAccountId={null}
        accounts={[]}
      />,
    );
    expect(screen.getByTestId('connection-dot')).toHaveAttribute('data-mode', 'disconnected');
  });

  it('shows an error status indicator when production connection has an error', () => {
    render(<Sidebar {...baseProps} connectionMode="production" connectionError="creds revoked" />);
    const dot = screen.getByTestId('connection-dot');
    expect(dot).toHaveAttribute('data-mode', 'error');
    expect(dot.className).toContain('bg-danger');
  });

  it('shows error (not emulator) when an emulator connection has an error', () => {
    render(
      <Sidebar
        {...baseProps}
        connectionMode="emulator"
        emulatorProjectId="demo-app"
        activeAccountId={null}
        accounts={[]}
        connectionError="emulator unreachable"
      />,
    );
    expect(screen.getByTestId('connection-dot')).toHaveAttribute('data-mode', 'error');
  });

  it('ignores a stale error when disconnected', () => {
    render(<Sidebar {...baseProps} connectionMode={null} connectionError="old error" />);
    expect(screen.getByTestId('connection-dot')).toHaveAttribute('data-mode', 'disconnected');
  });

  it('toggles the theme from the footer', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...baseProps} />);
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(useViewStore.getState().theme).toBe('light');
  });

  it('renders a collections section and the tree', () => {
    render(<Sidebar {...baseProps} />);
    expect(screen.getByText(/collections/i)).toBeInTheDocument();
    expect(screen.getByTestId('collection-tree')).toBeInTheDocument();
  });
});
