import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConnectionManagerDialog } from '@/components/dialogs/ConnectionManagerDialog';
import type { ConnectionEntry } from '@/types/firestore';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  connections: [] as ConnectionEntry[],
  onSwitch: vi.fn(),
  onRemove: vi.fn(),
};

const prodConnection: ConnectionEntry = {
  id: 'prod-myproj',
  mode: { type: 'production' },
  isActive: true,
};

const emuConnection: ConnectionEntry = {
  id: 'emu-demo',
  mode: { type: 'emulator', url: 'http://localhost:8080', project_id: 'demo' },
  isActive: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ConnectionManagerDialog', () => {
  it('shows empty state when no connections', () => {
    render(<ConnectionManagerDialog {...defaultProps} />);
    expect(screen.getByText(/no connections/i)).toBeInTheDocument();
  });

  it('renders list of connections', () => {
    render(
      <ConnectionManagerDialog
        {...defaultProps}
        connections={[prodConnection, emuConnection]}
      />,
    );
    expect(screen.getByText('prod-myproj')).toBeInTheDocument();
    expect(screen.getByText('emu-demo')).toBeInTheDocument();
  });

  it('shows active indicator on active connection', () => {
    render(
      <ConnectionManagerDialog
        {...defaultProps}
        connections={[prodConnection, emuConnection]}
      />,
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('calls onSwitch when Switch button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConnectionManagerDialog
        {...defaultProps}
        connections={[prodConnection, emuConnection]}
      />,
    );
    const switchBtn = screen.getByRole('button', { name: /switch/i });
    await user.click(switchBtn);
    expect(defaultProps.onSwitch).toHaveBeenCalledWith('emu-demo');
  });

  it('calls onRemove when Remove button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConnectionManagerDialog
        {...defaultProps}
        connections={[prodConnection, emuConnection]}
      />,
    );
    const removeBtns = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeBtns[0]);
    expect(defaultProps.onRemove).toHaveBeenCalledWith('prod-myproj');
  });

  it('does not show Switch button for active connection', () => {
    render(
      <ConnectionManagerDialog
        {...defaultProps}
        connections={[prodConnection]}
      />,
    );
    expect(screen.queryByRole('button', { name: /switch/i })).not.toBeInTheDocument();
  });
});
