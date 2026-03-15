import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('DeleteConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    isDeleting: false,
    mode: 'document' as const,
    targetPath: 'users/doc1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('document mode', () => {
    it('renders document deletion dialog', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      expect(screen.getByText('Delete document')).toBeInTheDocument();
      expect(screen.getByText(/users\/doc1/)).toBeInTheDocument();
    });

    it('calls onConfirm when Delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
    });

    it('does not require typing confirmation for documents', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).not.toBeDisabled();
    });

    it('calls onOpenChange when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmDialog {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('disables buttons when isDeleting is true', () => {
      render(<DeleteConfirmDialog {...defaultProps} isDeleting={true} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  describe('collection mode', () => {
    const collectionProps = {
      ...defaultProps,
      mode: 'collection' as const,
      targetPath: 'users',
    };

    it('renders collection deletion dialog', () => {
      render(<DeleteConfirmDialog {...collectionProps} />);
      expect(screen.getByText('Delete collection')).toBeInTheDocument();
    });

    it('requires typing collection name to enable delete button', () => {
      render(<DeleteConfirmDialog {...collectionProps} />);
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toBeDisabled();
    });

    it('enables delete button after typing correct collection name', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmDialog {...collectionProps} />);
      const input = screen.getByPlaceholderText('Type "users" to confirm');
      await user.type(input, 'users');
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).not.toBeDisabled();
    });

    it('does not enable delete with partial name', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmDialog {...collectionProps} />);
      const input = screen.getByPlaceholderText('Type "users" to confirm');
      await user.type(input, 'user');
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toBeDisabled();
    });

    it('handles nested collection paths correctly', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmDialog {...collectionProps} targetPath="users/123/posts" />);
      // Should only need the last segment
      const input = screen.getByPlaceholderText('Type "posts" to confirm');
      await user.type(input, 'posts');
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).not.toBeDisabled();
    });

    it('calls onConfirm after typing name and clicking Delete', async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmDialog {...collectionProps} />);
      const input = screen.getByPlaceholderText('Type "users" to confirm');
      await user.type(input, 'users');
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(collectionProps.onConfirm).toHaveBeenCalledOnce();
    });

    it('resets confirmation input when dialog closes', () => {
      const { rerender } = render(<DeleteConfirmDialog {...collectionProps} />);
      rerender(<DeleteConfirmDialog {...collectionProps} open={false} />);
      rerender(<DeleteConfirmDialog {...collectionProps} open={true} />);
      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('when closed', () => {
    it('does not render content when open is false', () => {
      render(<DeleteConfirmDialog {...defaultProps} open={false} />);
      expect(screen.queryByText('Delete document')).not.toBeInTheDocument();
    });
  });
});
