import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SaveQueryDialog } from '@/components/dialogs/SaveQueryDialog';

describe('SaveQueryDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with name input', () => {
    render(<SaveQueryDialog {...defaultProps} />);
    expect(screen.getByText('Save query')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Query name')).toBeInTheDocument();
  });

  it('disables Save button when name is empty', () => {
    render(<SaveQueryDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('enables Save button when name is entered', async () => {
    const user = userEvent.setup();
    render(<SaveQueryDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Query name'), 'My Query');
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
  });

  it('calls onSave with query name on submit', async () => {
    const user = userEvent.setup();
    render(<SaveQueryDialog {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Query name'), 'Active Users');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(defaultProps.onSave).toHaveBeenCalledWith('Active Users');
  });

  it('calls onOpenChange when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<SaveQueryDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not render when closed', () => {
    render(<SaveQueryDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Save query')).not.toBeInTheDocument();
  });

  it('resets input when dialog reopens', () => {
    const { rerender } = render(<SaveQueryDialog {...defaultProps} />);
    rerender(<SaveQueryDialog {...defaultProps} open={false} />);
    rerender(<SaveQueryDialog {...defaultProps} open={true} />);
    expect(screen.getByPlaceholderText('Query name')).toHaveValue('');
  });
});
