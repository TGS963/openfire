import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CollectionTree } from '@/components/collections/CollectionTree';
import { useCollections } from '@/hooks/firestore';

vi.mock('@/hooks/firestore', () => ({
  useCollections: vi.fn(),
  useDocuments: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
}));

const mockedUseCollections = vi.mocked(useCollections);

describe('CollectionTree', () => {
  const defaultProps = {
    parentDocumentPath: null as string | null,
    collectionPath: null as string | null,
    onSelectCollection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Loading collections…" when useCollections returns isLoading: true', () => {
    mockedUseCollections.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useCollections>);

    render(<CollectionTree {...defaultProps} />);
    expect(screen.getByText('Loading collections…')).toBeInTheDocument();
  });

  it('shows "No collections found." when useCollections returns empty collectionIds', () => {
    mockedUseCollections.mockReturnValue({
      data: { collectionIds: [], nextPageToken: null },
      isLoading: false,
    } as unknown as ReturnType<typeof useCollections>);

    render(<CollectionTree {...defaultProps} />);
    expect(screen.getByText('No collections found.')).toBeInTheDocument();
  });

  it('renders collection names as buttons when data is available', () => {
    mockedUseCollections.mockReturnValue({
      data: { collectionIds: ['users', 'posts', 'comments'], nextPageToken: null },
      isLoading: false,
    } as unknown as ReturnType<typeof useCollections>);

    render(<CollectionTree {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'users' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'posts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'comments' })).toBeInTheDocument();
  });

  it('calls onSelectCollection when a collection is clicked', async () => {
    const user = userEvent.setup();
    mockedUseCollections.mockReturnValue({
      data: { collectionIds: ['users', 'posts'], nextPageToken: null },
      isLoading: false,
    } as unknown as ReturnType<typeof useCollections>);

    render(<CollectionTree {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'posts' }));
    expect(defaultProps.onSelectCollection).toHaveBeenCalledWith('posts');
  });

  it('does not render subcollections initially (no recursive tree)', () => {
    mockedUseCollections.mockReturnValue({
      data: { collectionIds: ['users'], nextPageToken: null },
      isLoading: false,
    } as unknown as ReturnType<typeof useCollections>);

    render(<CollectionTree {...defaultProps} />);

    // useCollections should only be called once (for the root level)
    expect(mockedUseCollections).toHaveBeenCalledTimes(1);
  });
});
