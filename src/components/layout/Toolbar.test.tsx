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

  it('exposes Save and Discard when there are pending changes', async () => {
    const user = userEvent.setup();
    const onSavePending = vi.fn();
    const onDiscardPending = vi.fn();
    render(
      <Toolbar
        {...baseProps}
        pendingCount={3}
        savableCount={3}
        onSavePending={onSavePending}
        onDiscardPending={onDiscardPending}
      />,
    );
    await user.click(screen.getByRole('button', { name: /more/i }));
    await user.click(await screen.findByText(/save changes/i));
    expect(onSavePending).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /more/i }));
    await user.click(await screen.findByText(/discard unsaved changes/i));
    expect(onDiscardPending).toHaveBeenCalledTimes(1);
  });

  it('shows Discard but hides Save when only non-savable drafts are pending', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        {...baseProps}
        pendingCount={1}
        savableCount={0}
        onSavePending={vi.fn()}
        onDiscardPending={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /more/i }));
    expect(await screen.findByText(/discard unsaved changes/i)).toBeInTheDocument();
    expect(screen.queryByText(/save changes/i)).toBeNull();
  });

  it('keeps the more menu reachable for pending edits with no collection', async () => {
    const user = userEvent.setup();
    const onDiscardPending = vi.fn();
    render(
      <Toolbar
        {...baseProps}
        collectionPath={null}
        breadcrumbs={[]}
        pendingCount={2}
        savableCount={0}
        onDiscardPending={onDiscardPending}
      />,
    );
    const more = screen.getByRole('button', { name: /more/i });
    expect(more).not.toBeDisabled();
    await user.click(more);
    await user.click(await screen.findByText(/discard unsaved changes/i));
    expect(onDiscardPending).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Duplicate')).toBeNull();
  });

  it('hides Save and Discard when there are no pending changes', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        {...baseProps}
        pendingCount={0}
        onSavePending={vi.fn()}
        onDiscardPending={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /more/i }));
    expect(screen.queryByText(/save changes/i)).toBeNull();
    expect(screen.queryByText(/discard unsaved changes/i)).toBeNull();
  });
});
