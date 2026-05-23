import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { usePaletteStore } from '@/stores/palette-store';
import { useTabsStore } from '@/stores/tabs-store';
import { useNavStore } from '@/stores/nav-store';
import { useQueryStore } from '@/stores/query-store';
import { useRecentsStore } from '@/stores/recents-store';
import type { useCollections } from '@/hooks/firestore';

const mockedUseCollections = vi.fn();
vi.mock('@/hooks/firestore', () => ({
  useCollections: () => mockedUseCollections(),
}));

import { CommandPalette } from '@/components/layout/CommandPalette';

const setCollections = (ids: string[]) =>
  mockedUseCollections.mockReturnValue({
    data: { collectionIds: ids, nextPageToken: null },
    isLoading: false,
  } as unknown as ReturnType<typeof useCollections>);

beforeEach(() => {
  vi.clearAllMocks();
  setCollections(['users', 'posts']);
  usePaletteStore.setState({ isOpen: true, query: '', mode: 'default' });
  useTabsStore.setState({ tabs: [], activeId: null });
  useNavStore.getState().reset();
  useQueryStore.setState({ queries: [] });
  useRecentsStore.setState({ recent: [] });
});

const actions = [
  { id: 'export', label: 'Export collection…', run: vi.fn() },
  { id: 'import-sa', label: 'Import service account', run: vi.fn() },
];

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    usePaletteStore.setState({ isOpen: false });
    const { container } = render(<CommandPalette actions={actions} onLoadQuery={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders collections and actions when open', () => {
    render(<CommandPalette actions={actions} onLoadQuery={vi.fn()} />);
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('posts')).toBeInTheDocument();
    expect(screen.getByText('Export collection…')).toBeInTheDocument();
  });

  it('filters items by typed query', async () => {
    const user = userEvent.setup();
    render(<CommandPalette actions={actions} onLoadQuery={vi.fn()} />);
    await user.type(screen.getByRole('combobox'), 'post');
    expect(screen.getByText('posts')).toBeInTheDocument();
    expect(screen.queryByText('users')).not.toBeInTheDocument();
  });

  it('opens a collection tab and closes when a collection is selected', async () => {
    const user = userEvent.setup();
    render(<CommandPalette actions={actions} onLoadQuery={vi.fn()} />);
    await user.click(screen.getByText('users'));
    expect(useTabsStore.getState().tabs.some((t) => t.path === 'users')).toBe(true);
    expect(usePaletteStore.getState().isOpen).toBe(false);
  });

  it('runs an action and closes', async () => {
    const user = userEvent.setup();
    render(<CommandPalette actions={actions} onLoadQuery={vi.fn()} />);
    await user.click(screen.getByText('Export collection…'));
    expect(actions[0].run).toHaveBeenCalledTimes(1);
    expect(usePaletteStore.getState().isOpen).toBe(false);
  });

  it('shows recent documents and opens one', async () => {
    const user = userEvent.setup();
    useRecentsStore.setState({ recent: ['users/abc123'] });
    render(<CommandPalette actions={actions} onLoadQuery={vi.fn()} />);
    await user.click(screen.getByText('abc123'));
    expect(useTabsStore.getState().tabs.some((t) => t.path === 'users/abc123')).toBe(true);
  });

  it('loads a saved query', async () => {
    const user = userEvent.setup();
    const onLoadQuery = vi.fn();
    useQueryStore.setState({
      queries: [
        {
          id: 'q1',
          name: 'Adults',
          collectionPath: 'users',
          filters: [{ field: 'age', operator: '>=', value: 18 }],
          orderBy: [],
          createdAt: 1,
        },
      ],
    });
    render(<CommandPalette actions={actions} onLoadQuery={onLoadQuery} />);
    await user.click(screen.getByText('Adults'));
    expect(onLoadQuery).toHaveBeenCalledTimes(1);
  });
});
