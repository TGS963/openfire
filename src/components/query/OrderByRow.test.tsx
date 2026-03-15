import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { OrderByRow, type OrderByRowData } from '@/components/query/OrderByRow';

describe('OrderByRow', () => {
  const defaultOrderBy: OrderByRowData = { field: 'createdAt', direction: 'asc' };

  it('renders field input and direction button', () => {
    render(<OrderByRow orderBy={defaultOrderBy} onChange={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByPlaceholderText('Field path')).toHaveValue('createdAt');
    expect(screen.getByText('ASC')).toBeInTheDocument();
  });

  it('toggles direction from asc to desc', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OrderByRow orderBy={defaultOrderBy} onChange={onChange} onRemove={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /sort/i }));
    expect(onChange).toHaveBeenCalledWith({ field: 'createdAt', direction: 'desc' });
  });

  it('toggles direction from desc to asc', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <OrderByRow orderBy={{ field: 'name', direction: 'desc' }} onChange={onChange} onRemove={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /sort/i }));
    expect(onChange).toHaveBeenCalledWith({ field: 'name', direction: 'asc' });
  });

  it('calls onRemove when remove button is clicked', async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(<OrderByRow orderBy={defaultOrderBy} onChange={vi.fn()} onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: 'Remove order' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
