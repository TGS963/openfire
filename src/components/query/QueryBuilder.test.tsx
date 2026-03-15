import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { QueryBuilder } from '@/components/query/QueryBuilder';

describe('QueryBuilder', () => {
  const defaultProps = {
    collectionPath: 'users',
    onRunQuery: vi.fn(),
    onClearQuery: vi.fn(),
    isQuerying: false,
  };

  it('renders add filter and add order by buttons', () => {
    render(<QueryBuilder {...defaultProps} />);
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /order by/i })).toBeInTheDocument();
  });

  it('renders run query and clear buttons', () => {
    render(<QueryBuilder {...defaultProps} />);
    expect(screen.getByRole('button', { name: /run query/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('adds a filter row when clicking add filter', async () => {
    const user = userEvent.setup();
    render(<QueryBuilder {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /filter/i }));
    expect(screen.getByPlaceholderText('Field path')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Value')).toBeInTheDocument();
  });

  it('adds an order by row when clicking add order by', async () => {
    const user = userEvent.setup();
    render(<QueryBuilder {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /order by/i }));
    expect(screen.getByPlaceholderText('Field path')).toBeInTheDocument();
    expect(screen.getByText('ASC')).toBeInTheDocument();
  });

  it('calls onRunQuery with correct spec when run is clicked', async () => {
    const onRunQuery = vi.fn();
    const user = userEvent.setup();
    render(<QueryBuilder {...defaultProps} onRunQuery={onRunQuery} />);

    // Add a filter
    await user.click(screen.getByRole('button', { name: /filter/i }));
    await user.type(screen.getByPlaceholderText('Field path'), 'age');
    await user.type(screen.getByPlaceholderText('Value'), '25');

    await user.click(screen.getByRole('button', { name: /run query/i }));

    expect(onRunQuery).toHaveBeenCalledWith({
      collectionPath: 'users',
      filters: [{ field: 'age', operator: '==', value: 25 }],
      orderBy: [],
      limit: undefined,
    });
  });

  it('parses string values correctly', async () => {
    const onRunQuery = vi.fn();
    const user = userEvent.setup();
    render(<QueryBuilder {...defaultProps} onRunQuery={onRunQuery} />);

    await user.click(screen.getByRole('button', { name: /filter/i }));
    await user.type(screen.getByPlaceholderText('Field path'), 'name');
    await user.type(screen.getByPlaceholderText('Value'), 'Alice');

    await user.click(screen.getByRole('button', { name: /run query/i }));

    expect(onRunQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ field: 'name', operator: '==', value: 'Alice' }],
      }),
    );
  });

  it('parses boolean values correctly', async () => {
    const onRunQuery = vi.fn();
    const user = userEvent.setup();
    render(<QueryBuilder {...defaultProps} onRunQuery={onRunQuery} />);

    await user.click(screen.getByRole('button', { name: /filter/i }));
    await user.type(screen.getByPlaceholderText('Field path'), 'active');
    await user.type(screen.getByPlaceholderText('Value'), 'true');

    await user.click(screen.getByRole('button', { name: /run query/i }));

    expect(onRunQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ field: 'active', operator: '==', value: true }],
      }),
    );
  });

  it('calls onClearQuery when clear is clicked', async () => {
    const onClearQuery = vi.fn();
    const user = userEvent.setup();
    render(<QueryBuilder {...defaultProps} onClearQuery={onClearQuery} />);
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClearQuery).toHaveBeenCalledOnce();
  });

  it('skips filters with empty field or value', async () => {
    const onRunQuery = vi.fn();
    const user = userEvent.setup();
    render(<QueryBuilder {...defaultProps} onRunQuery={onRunQuery} />);

    // Add filter but leave it empty
    await user.click(screen.getByRole('button', { name: /filter/i }));
    await user.click(screen.getByRole('button', { name: /run query/i }));

    expect(onRunQuery).toHaveBeenCalledWith(
      expect.objectContaining({ filters: [] }),
    );
  });

  it('disables run button when isQuerying is true', () => {
    render(<QueryBuilder {...defaultProps} isQuerying={true} />);
    expect(screen.getByRole('button', { name: /run query/i })).toBeDisabled();
  });
});
