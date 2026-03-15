import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { QueryBar } from '@/components/query/QueryBar';

describe('QueryBar', () => {
  const defaultProps = {
    collectionPath: 'users',
    activeQuery: null,
    onRunQuery: vi.fn(),
    onClearQuery: vi.fn(),
    isQuerying: false,
    onSaveQuery: vi.fn(),
    onLoadQuery: vi.fn(),
  };

  it('renders the query toggle button', () => {
    render(<QueryBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /query/i })).toBeInTheDocument();
  });

  it('does not show the query builder initially', () => {
    render(<QueryBar {...defaultProps} />);
    expect(screen.queryByText('Run Query')).not.toBeInTheDocument();
  });

  it('shows the query builder when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<QueryBar {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /query/i }));
    expect(screen.getByRole('button', { name: /run query/i })).toBeInTheDocument();
  });

  it('shows "Query active" text when a query is active', () => {
    const query = {
      collectionPath: 'users',
      filters: [{ field: 'age', operator: '>=' as const, value: 18 }],
      orderBy: [],
    };
    render(<QueryBar {...defaultProps} activeQuery={query} />);
    expect(screen.getByText(/query active/i)).toBeInTheDocument();
  });

  it('shows filter count in badge when active query has filters', () => {
    const query = {
      collectionPath: 'users',
      filters: [
        { field: 'age', operator: '>=' as const, value: 18 },
        { field: 'name', operator: '==' as const, value: 'Alice' },
      ],
      orderBy: [],
    };
    render(<QueryBar {...defaultProps} activeQuery={query} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
