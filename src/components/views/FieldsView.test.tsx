import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { FieldsView } from '@/components/views/FieldsView';

describe('FieldsView', () => {
  const defaultProps = {
    data: { name: 'Alice', age: 30, active: true } as Record<string, unknown>,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all top-level field names', () => {
    render(<FieldsView {...defaultProps} />);
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders field values', () => {
    render(<FieldsView {...defaultProps} />);
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
  });

  it('calls onChange when editing a string field', async () => {
    const user = userEvent.setup();
    render(<FieldsView {...defaultProps} />);
    const nameInput = screen.getByDisplayValue('Alice');
    await user.type(nameInput, 'x');
    // onChange should have been called with the appended character
    expect(defaultProps.onChange).toHaveBeenCalled();
    const lastCall = defaultProps.onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.name).toBe('Alicex');
  });

  it('shows type badges for each field', () => {
    render(<FieldsView {...defaultProps} />);
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(screen.getByText('number')).toBeInTheDocument();
    expect(screen.getByText('boolean')).toBeInTheDocument();
  });

  it('renders empty state when data has no fields', () => {
    render(<FieldsView data={{}} onChange={vi.fn()} />);
    expect(screen.getByText('No fields')).toBeInTheDocument();
  });

  it('renders add field button', () => {
    render(<FieldsView {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
  });

  it('renders delete buttons for each field', () => {
    render(<FieldsView {...defaultProps} />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons).toHaveLength(3);
  });

  it('calls onChange with field removed when delete is clicked', async () => {
    const user = userEvent.setup();
    render(<FieldsView {...defaultProps} />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]); // delete first field (name)
    expect(defaultProps.onChange).toHaveBeenCalledWith({ age: 30, active: true });
  });

  it('shows nested map fields when expanded', async () => {
    const user = userEvent.setup();
    const data = { address: { city: 'NYC', zip: '10001' } };
    render(<FieldsView data={data} onChange={vi.fn()} />);
    // Click to expand the map
    const expandButton = screen.getByRole('button', { name: /expand/i });
    await user.click(expandButton);
    expect(screen.getByText('city')).toBeInTheDocument();
    expect(screen.getByText('zip')).toBeInTheDocument();
  });
});
