import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { FilterRow, type FilterRowData } from '@/components/query/FilterRow';

describe('FilterRow', () => {
  const defaultFilter: FilterRowData = { field: 'age', operator: '==', value: '25' };

  it('renders field, operator, and value inputs', () => {
    render(<FilterRow filter={defaultFilter} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByPlaceholderText('Field path')).toHaveValue('age');
    expect(screen.getByPlaceholderText('Value')).toHaveValue('25');
  });

  it('calls onChange when field input changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterRow filter={{ field: '', operator: '==', value: '' }} onChange={onChange} onRemove={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Field path'), 'n');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'n', operator: '==', value: '' }),
    );
  });

  it('calls onChange when value input changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterRow filter={{ field: 'age', operator: '==', value: '' }} onChange={onChange} onRemove={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Value'), '30');
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onRemove when remove button is clicked', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<FilterRow filter={defaultFilter} onChange={vi.fn()} onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: 'Remove filter' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
