import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EmulatorConnectDialog } from '@/components/dialogs/EmulatorConnectDialog';

describe('EmulatorConnectDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with project id and url inputs', () => {
    render(<EmulatorConnectDialog {...defaultProps} />);
    expect(screen.getByText('Connect to emulator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('my-project-id')).toBeInTheDocument();
    expect(screen.getByDisplayValue('http://localhost:8080')).toBeInTheDocument();
  });

  it('disables Connect button when project id is empty', () => {
    render(<EmulatorConnectDialog {...defaultProps} />);
    const connectButton = screen.getByRole('button', { name: 'Connect' });
    expect(connectButton).toBeDisabled();
  });

  it('enables Connect button when project id is entered', async () => {
    const user = userEvent.setup();
    render(<EmulatorConnectDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('my-project-id'), 'my-project');
    const connectButton = screen.getByRole('button', { name: 'Connect' });
    expect(connectButton).not.toBeDisabled();
  });

  it('calls onSubmit with project id and emulator url', async () => {
    const user = userEvent.setup();
    render(<EmulatorConnectDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('my-project-id'), 'test-proj');
    await user.click(screen.getByRole('button', { name: 'Connect' }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      projectId: 'test-proj',
      emulatorUrl: 'http://localhost:8080',
    });
  });

  it('allows changing emulator url', async () => {
    const user = userEvent.setup();
    render(<EmulatorConnectDialog {...defaultProps} />);
    const urlInput = screen.getByDisplayValue('http://localhost:8080');
    await user.clear(urlInput);
    await user.type(urlInput, 'http://localhost:9090');
    await user.type(screen.getByPlaceholderText('my-project-id'), 'proj');
    await user.click(screen.getByRole('button', { name: 'Connect' }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      projectId: 'proj',
      emulatorUrl: 'http://localhost:9090',
    });
  });

  it('calls onOpenChange when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<EmulatorConnectDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables buttons when isSubmitting is true', () => {
    render(<EmulatorConnectDialog {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('does not render when closed', () => {
    render(<EmulatorConnectDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Connect to emulator')).not.toBeInTheDocument();
  });

  it('resets fields when dialog closes and reopens', () => {
    const { rerender } = render(<EmulatorConnectDialog {...defaultProps} />);
    rerender(<EmulatorConnectDialog {...defaultProps} open={false} />);
    rerender(<EmulatorConnectDialog {...defaultProps} open={true} />);
    expect(screen.getByPlaceholderText('my-project-id')).toHaveValue('');
    expect(screen.getByDisplayValue('http://localhost:8080')).toBeInTheDocument();
  });
});
