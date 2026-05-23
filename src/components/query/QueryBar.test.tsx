import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { QueryBar } from '@/components/query/QueryBar';
import type { QuerySpec } from '@/types/firestore';

describe('QueryBar', () => {
  const defaultProps = {
    collectionPath: 'users',
    activeQuery: null as QuerySpec | null,
    onRunQuery: vi.fn(),
    onClearQuery: vi.fn(),
    isQuerying: false,
    onSaveQuery: vi.fn(),
    onLoadQuery: vi.fn(),
  };

  const query: QuerySpec = {
    collectionPath: 'users',
    filters: [
      { field: 'age', operator: '>=', value: 18 },
      { field: 'name', operator: '==', value: 'Alice' },
    ],
    orderBy: [],
  };

  it('renders an add-filter affordance', () => {
    render(<QueryBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add filter/i })).toBeInTheDocument();
  });

  it('opens the query builder when add-filter is clicked', async () => {
    const user = userEvent.setup();
    render(<QueryBar {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /add filter/i }));
    expect(screen.getByRole('button', { name: /run query/i })).toBeInTheDocument();
  });

  it('renders a chip per active filter', () => {
    render(<QueryBar {...defaultProps} activeQuery={query} />);
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('removes a filter chip and re-runs with the remaining filters', async () => {
    const user = userEvent.setup();
    const onRunQuery = vi.fn();
    render(<QueryBar {...defaultProps} activeQuery={query} onRunQuery={onRunQuery} />);
    await user.click(screen.getByRole('button', { name: /remove filter age/i }));
    expect(onRunQuery).toHaveBeenCalledWith(
      expect.objectContaining({ filters: [{ field: 'name', operator: '==', value: 'Alice' }] }),
    );
  });

  it('clears the query when removing the last chip', async () => {
    const user = userEvent.setup();
    const onClearQuery = vi.fn();
    const single: QuerySpec = {
      collectionPath: 'users',
      filters: [{ field: 'age', operator: '>=', value: 18 }],
      orderBy: [],
    };
    render(<QueryBar {...defaultProps} activeQuery={single} onClearQuery={onClearQuery} />);
    await user.click(screen.getByRole('button', { name: /remove filter age/i }));
    expect(onClearQuery).toHaveBeenCalledTimes(1);
  });

  it('shows a match count when provided', () => {
    render(<QueryBar {...defaultProps} activeQuery={query} matchCount={318} />);
    expect(screen.getByText(/318 matches/i)).toBeInTheDocument();
  });

  it('calls onSaveQuery and onClearQuery from the action buttons', async () => {
    const user = userEvent.setup();
    const onSaveQuery = vi.fn();
    const onClearQuery = vi.fn();
    render(
      <QueryBar
        {...defaultProps}
        activeQuery={query}
        onSaveQuery={onSaveQuery}
        onClearQuery={onClearQuery}
      />,
    );
    await user.click(screen.getByRole('button', { name: /save/i }));
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(onSaveQuery).toHaveBeenCalledTimes(1);
    expect(onClearQuery).toHaveBeenCalledTimes(1);
  });
});
