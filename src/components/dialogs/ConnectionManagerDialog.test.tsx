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
  id: 'prod-upscayl-cloud',
  mode: { type: 'production' },
  isActive: true,
};

const prodDevConnection: ConnectionEntry = {
  id: 'prod-upscayl-cloud-dev',
  mode: { type: 'production' },
  isActive: false,
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

  it('labels an emulator row with its project id', () => {
    render(
      <ConnectionManagerDialog {...defaultProps} connections={[emuConnection]} />,
    );
    expect(screen.getByText('demo')).toBeInTheDocument();
    expect(screen.queryByText('emu-demo')).not.toBeInTheDocument();
  });

  it('labels each production row from its prod-<project_id>', () => {
    render(
      <ConnectionManagerDialog
        {...defaultProps}
        connections={[prodConnection, prodDevConnection]}
      />,
    );
    expect(screen.getByText('upscayl-cloud')).toBeInTheDocument();
    expect(screen.getByText('upscayl-cloud-dev')).toBeInTheDocument();
  });

  it('falls back to a placeholder name when the id lacks the prod- prefix', () => {
    render(
      <ConnectionManagerDialog
        {...defaultProps}
        connections={[{ id: 'legacy', mode: { type: 'production' }, isActive: false }]}
      />,
    );
    expect(screen.getByText('Unknown project')).toBeInTheDocument();
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
    expect(defaultProps.onRemove).toHaveBeenCalledWith('prod-upscayl-cloud');
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
