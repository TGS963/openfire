import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CreateCollectionDialog } from '@/components/dialogs/CreateCollectionDialog';

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('CreateCollectionDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog title and fields', () => {
    render(<CreateCollectionDialog {...defaultProps} />);
    expect(screen.getByText('New collection')).toBeInTheDocument();
    expect(screen.getByLabelText(/Collection ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Document ID/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CreateCollectionDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('New collection')).not.toBeInTheDocument();
  });

  it('rejects empty collection ID', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionDialog {...defaultProps} />);
    await user.type(screen.getByLabelText(/Document ID/i), 'doc-1');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });

  it('rejects collection ID containing a slash', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionDialog {...defaultProps} />);
    await user.type(screen.getByLabelText(/Collection ID/i), 'a/b');
    await user.type(screen.getByLabelText(/Document ID/i), 'doc-1');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });

  it('rejects collection ID starting with double underscore', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionDialog {...defaultProps} />);
    await user.type(screen.getByLabelText(/Collection ID/i), '__reserved');
    await user.type(screen.getByLabelText(/Document ID/i), 'doc-1');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });

  it('rejects empty document ID', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionDialog {...defaultProps} />);
    await user.type(screen.getByLabelText(/Collection ID/i), 'users');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });

  it('rejects invalid JSON payload', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionDialog {...defaultProps} />);
    await user.type(screen.getByLabelText(/Collection ID/i), 'users');
    await user.type(screen.getByLabelText(/Document ID/i), 'doc-1');
    const textarea = screen.getByLabelText(/JSON payload/i);
    await user.clear(textarea);
    await user.type(textarea, '{{not valid');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });

  it('submits collection ID, document ID, and parsed data', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionDialog {...defaultProps} />);
    await user.type(screen.getByLabelText(/Collection ID/i), 'users');
    await user.type(screen.getByLabelText(/Document ID/i), 'doc-1');
    const textarea = screen.getByLabelText(/JSON payload/i);
    await user.clear(textarea);
    await user.type(textarea, '{{"name":"Ada"}');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      collectionId: 'users',
      documentId: 'doc-1',
      data: { name: 'Ada' },
    });
  });

  it('submits empty object when payload is blank', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionDialog {...defaultProps} />);
    await user.type(screen.getByLabelText(/Collection ID/i), 'users');
    await user.type(screen.getByLabelText(/Document ID/i), 'doc-1');
    const textarea = screen.getByLabelText(/JSON payload/i);
    await user.clear(textarea);
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      collectionId: 'users',
      documentId: 'doc-1',
      data: {},
    });
  });

  it('calls onOpenChange when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateCollectionDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables Create button when submitting', () => {
    render(<CreateCollectionDialog {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: /Create|Loading/ })).toBeDisabled();
  });
});
