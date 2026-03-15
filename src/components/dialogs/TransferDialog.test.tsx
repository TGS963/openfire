import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TransferDialog } from '@/components/dialogs/TransferDialog';
import type { ConnectionEntry } from '@/types/firestore';

const prodConn: ConnectionEntry = {
  id: 'prod-a',
  mode: { type: 'production' },
  isActive: true,
};

const emuConn: ConnectionEntry = {
  id: 'emu-demo',
  mode: { type: 'emulator', url: 'http://localhost:8080', project_id: 'demo' },
  isActive: false,
};

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  connections: [prodConn, emuConn],
  sourceConnectionId: 'prod-a',
  sourceCollectionPath: 'users',
  onTransfer: vi.fn(),
  isTransferring: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TransferDialog', () => {
  it('renders source info', () => {
    render(<TransferDialog {...defaultProps} />);
    expect(screen.getByText('prod-a')).toBeInTheDocument();
    expect(screen.getByText('users')).toBeInTheDocument();
  });

  it('shows destination connection options excluding source', () => {
    render(<TransferDialog {...defaultProps} />);
    // Source is prod-a, so only emu-demo should be in the destination select
    expect(screen.getByText('emu-demo')).toBeInTheDocument();
  });

  it('has a destination collection path input', () => {
    render(<TransferDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText(/destination collection/i)).toBeInTheDocument();
  });

  it('disables Transfer button when destination is incomplete', () => {
    render(<TransferDialog {...defaultProps} />);
    const transferBtn = screen.getByRole('button', { name: /transfer/i });
    expect(transferBtn).toBeDisabled();
  });

  it('calls onTransfer with correct params when submitted', async () => {
    const user = userEvent.setup();
    render(<TransferDialog {...defaultProps} />);

    // Select destination connection
    const destSelect = screen.getByRole('combobox');
    await user.selectOptions(destSelect, 'emu-demo');

    // Fill destination collection path
    const input = screen.getByPlaceholderText(/destination collection/i);
    await user.type(input, 'users_backup');

    const transferBtn = screen.getByRole('button', { name: /transfer/i });
    await user.click(transferBtn);

    expect(defaultProps.onTransfer).toHaveBeenCalledWith({
      sourceConnectionId: 'prod-a',
      destConnectionId: 'emu-demo',
      sourceCollectionPath: 'users',
      destCollectionPath: 'users_backup',
      overwrite: false,
    });
  });

  it('shows Transferring state when isTransferring is true', () => {
    render(<TransferDialog {...defaultProps} isTransferring={true} />);
    expect(screen.getByRole('button', { name: /transferring/i })).toBeDisabled();
  });

  it('renders nothing useful when only one connection', () => {
    render(<TransferDialog {...defaultProps} connections={[prodConn]} />);
    expect(screen.getByText(/need at least two connections/i)).toBeInTheDocument();
  });
});
