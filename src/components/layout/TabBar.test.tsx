import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TabBar } from './TabBar';
import { useTabsStore } from '@/stores/tabs-store';
import { useNavStore } from '@/stores/nav-store';

beforeEach(() => {
  useTabsStore.setState({ tabs: [], activeId: null });
  useNavStore.getState().reset();
});

describe('TabBar', () => {
  it('renders an empty bar (no tab items) when there are no tabs', () => {
    const { container } = render(<TabBar />);
    expect(container.querySelector('[data-testid="tab"]')).toBeNull();
    // The bar itself still occupies its row so the page layout does not snap up.
    expect(container.querySelector('[aria-label="New tab"]')).toBeInTheDocument();
  });

  it('renders a tab per open tab with its label', () => {
    useTabsStore.getState().openCollection('users');
    useTabsStore.getState().openDocument('users/abc123');
    render(<TabBar />);
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
  });

  it('marks the active tab', () => {
    useTabsStore.getState().openCollection('users');
    const activeId = useTabsStore.getState().activeId;
    render(<TabBar />);
    const tab = screen.getByText('users').closest('[data-testid="tab"]');
    expect(tab).toHaveAttribute('data-active', 'true');
    expect(useTabsStore.getState().activeId).toBe(activeId);
  });

  it('switches tab on click', async () => {
    const user = userEvent.setup();
    useTabsStore.getState().openCollection('users');
    useTabsStore.getState().openCollection('posts');
    render(<TabBar />);
    await user.click(screen.getByText('users'));
    const usersId = useTabsStore.getState().tabs.find((t) => t.path === 'users')!.id;
    expect(useTabsStore.getState().activeId).toBe(usersId);
  });

  it('closes a tab via its close button', async () => {
    const user = userEvent.setup();
    useTabsStore.getState().openCollection('users');
    useTabsStore.getState().openCollection('posts');
    render(<TabBar />);
    await user.click(screen.getByRole('button', { name: /close tab users/i }));
    expect(useTabsStore.getState().tabs.map((t) => t.path)).toEqual(['posts']);
  });

  it('shows a dirty indicator instead of close for unsaved tabs', () => {
    useTabsStore.getState().openDocument('users/abc');
    const id = useTabsStore.getState().activeId!;
    useTabsStore.getState().setDirty(id, true);
    render(<TabBar />);
    expect(screen.getByTestId('tab-dirty')).toBeInTheDocument();
  });

  it('calls onNewTab when the + button is clicked', async () => {
    const user = userEvent.setup();
    const onNewTab = vi.fn();
    useTabsStore.getState().openCollection('users');
    render(<TabBar onNewTab={onNewTab} />);
    await user.click(screen.getByRole('button', { name: /new tab/i }));
    expect(onNewTab).toHaveBeenCalledTimes(1);
  });
});
