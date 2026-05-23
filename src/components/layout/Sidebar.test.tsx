import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import { useViewStore } from '@/stores/view-store';
import type { ServiceAccountSummary } from '@/types/firestore';

vi.mock('@/components/collections/CollectionTree', () => ({
  CollectionTree: () => <div data-testid="collection-tree" />,
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
