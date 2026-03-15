import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SavedQueryList } from '@/components/query/SavedQueryList';
import type { SavedQuery } from '@/types/firestore';

describe('SavedQueryList', () => {
  const queries: SavedQuery[] = [
    {
      id: 'q1',
      name: 'Active Users',
      collectionPath: 'users',
      filters: [{ field: 'active', operator: '==', value: true }],
      orderBy: [],
      createdAt: Date.now(),
    },
    {
      id: 'q2',
      name: 'Recent Posts',
      collectionPath: 'users',
      filters: [],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 10,
      createdAt: Date.now(),
    },
  ];

  const defaultProps = {
    queries,
    onLoad: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no queries', () => {
    render(<SavedQueryList {...defaultProps} queries={[]} />);
    expect(screen.getByText('No saved queries')).toBeInTheDocument();
  });

  it('renders query names', () => {
    render(<SavedQueryList {...defaultProps} />);
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Recent Posts')).toBeInTheDocument();
  });

  it('shows filter count for queries with filters', () => {
    render(<SavedQueryList {...defaultProps} />);
    expect(screen.getByText('1 filter')).toBeInTheDocument();
  });

  it('calls onLoad with query spec when load button is clicked', async () => {
    const user = userEvent.setup();
    render(<SavedQueryList {...defaultProps} />);
    const loadButtons = screen.getAllByRole('button', { name: /load/i });
    await user.click(loadButtons[0]);
    expect(defaultProps.onLoad).toHaveBeenCalledWith({
      collectionPath: 'users',
      filters: [{ field: 'active', operator: '==', value: true }],
      orderBy: [],
      limit: undefined,
    });
  });

  it('calls onDelete with query id when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<SavedQueryList {...defaultProps} />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[1]);
    expect(defaultProps.onDelete).toHaveBeenCalledWith('q2');
  });
});
