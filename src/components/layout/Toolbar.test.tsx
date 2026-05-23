import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';

const baseProps = {
  collectionPath: 'users',
  breadcrumbs: ['users'],
  onCrumbClick: vi.fn(),
  isLoading: false,
  onDuplicateCollection: vi.fn(),
};

describe('Toolbar', () => {
  it('renders breadcrumb segments', () => {
    render(<Toolbar {...baseProps} breadcrumbs={['users', 'k4eD', 'posts']} />);
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('posts')).toBeInTheDocument();
  });

  it('shows a placeholder when no collection is selected', () => {
    render(<Toolbar {...baseProps} collectionPath={null} breadcrumbs={[]} />);
    expect(screen.getByText(/nothing selected/i)).toBeInTheDocument();
  });

  it('fires onCrumbClick with the segment index', async () => {
    const user = userEvent.setup();
    const onCrumbClick = vi.fn();
    render(
      <Toolbar {...baseProps} breadcrumbs={['users', 'k4eD']} onCrumbClick={onCrumbClick} />,
    );
    await user.click(screen.getByText('users'));
    expect(onCrumbClick).toHaveBeenCalledWith(0);
  });

  it('toggles query and shell', async () => {
    const user = userEvent.setup();
    const onToggleQuery = vi.fn();
    const onToggleShell = vi.fn();
    render(
      <Toolbar
        {...baseProps}
        onToggleQuery={onToggleQuery}
        onToggleShell={onToggleShell}
      />,
    );
    await user.click(screen.getByRole('button', { name: /query/i }));
    await user.click(screen.getByRole('button', { name: /shell/i }));
    expect(onToggleQuery).toHaveBeenCalledTimes(1);
    expect(onToggleShell).toHaveBeenCalledTimes(1);
  });

  it('exposes Duplicate and Delete in the more menu', async () => {
    const user = userEvent.setup();
    const onDeleteCollection = vi.fn();
    render(<Toolbar {...baseProps} onDeleteCollection={onDeleteCollection} />);
    await user.click(screen.getByRole('button', { name: /more/i }));
    await user.click(await screen.findByText('Delete'));
    expect(onDeleteCollection).toHaveBeenCalledTimes(1);
  });
});
