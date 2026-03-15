import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { DocumentNode } from '@/components/collections/DocumentNode';

// Mock CollectionTree to avoid recursive rendering
vi.mock('@/components/collections/CollectionTree', () => ({
  CollectionTree: ({ parentDocumentPath }: { parentDocumentPath: string }) => (
    <div data-testid="mock-collection-tree" data-parent={parentDocumentPath} />
  ),
}));

describe('DocumentNode', () => {
  const defaultProps = {
    documentId: 'user123',
    documentPath: 'users/user123',
    collectionPath: null as string | null,
    onSelectCollection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the document ID', () => {
    render(<DocumentNode {...defaultProps} />);
    expect(screen.getByText('user123')).toBeInTheDocument();
  });

  it('shows an expand button', () => {
    render(<DocumentNode {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
  });

  it('does not show subcollections initially', () => {
    render(<DocumentNode {...defaultProps} />);
    expect(screen.queryByTestId('mock-collection-tree')).not.toBeInTheDocument();
  });

  it('shows subcollection tree when expanded', async () => {
    const user = userEvent.setup();
    render(<DocumentNode {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    const tree = screen.getByTestId('mock-collection-tree');
    expect(tree).toBeInTheDocument();
    expect(tree).toHaveAttribute('data-parent', 'users/user123');
  });

  it('hides subcollection tree when collapsed', async () => {
    const user = userEvent.setup();
    render(<DocumentNode {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByTestId('mock-collection-tree')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByTestId('mock-collection-tree')).not.toBeInTheDocument();
  });
});
