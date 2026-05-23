import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CollectionTreeItem } from '@/components/collections/CollectionTreeItem';
import { useDocumentsInfinite } from '@/hooks/firestore';

// Mock DocumentNode to avoid recursive rendering
vi.mock('@/components/collections/DocumentNode', () => ({
  DocumentNode: ({ documentId }: { documentId: string }) => (
    <div data-testid={`mock-doc-${documentId}`} />
  ),
}));

vi.mock('@/hooks/firestore', () => ({
  useDocumentsInfinite: vi.fn(),
}));

const mockedUseDocumentsInfinite = vi.mocked(useDocumentsInfinite);

type InfReturn = ReturnType<typeof useDocumentsInfinite>;

const mockReturn = (over: Partial<InfReturn> = {}): InfReturn =>
  ({
    data: undefined,
    isLoading: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    ...over,
  }) as unknown as InfReturn;

describe('CollectionTreeItem', () => {
  const defaultProps = {
    collectionId: 'users',
    fullPath: 'users',
    isActive: false,
    onSelect: vi.fn(),
    collectionPath: null as string | null,
    onSelectCollection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDocumentsInfinite.mockReturnValue(mockReturn());
  });

  it('renders the collection name', () => {
    render(<CollectionTreeItem {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'users' })).toBeInTheDocument();
  });

  it('calls onSelect when the collection name is clicked', async () => {
    const user = userEvent.setup();
    render(<CollectionTreeItem {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'users' }));
    expect(defaultProps.onSelect).toHaveBeenCalledOnce();
  });

  it('shows an expand chevron button', () => {
    render(<CollectionTreeItem {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
  });

  it('shows documents when expanded', async () => {
    mockedUseDocumentsInfinite.mockReturnValue(
      mockReturn({
        data: {
          pages: [
            {
              documents: [
                { id: 'doc1', path: 'users/doc1', data: {}, createTime: null, updateTime: null },
                { id: 'doc2', path: 'users/doc2', data: {}, createTime: null, updateTime: null },
              ],
              nextPageToken: null,
            },
          ],
          pageParams: [null],
        },
      } as unknown as Partial<InfReturn>),
    );

    const user = userEvent.setup();
    render(<CollectionTreeItem {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByTestId('mock-doc-doc1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-doc-doc2')).toBeInTheDocument();
  });

  it('shows loading state when expanding', async () => {
    mockedUseDocumentsInfinite.mockReturnValue(mockReturn({ isLoading: true }));

    const user = userEvent.setup();
    render(<CollectionTreeItem {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByText('Loading documents…')).toBeInTheDocument();
  });

  it('shows a Load more button when more pages are available', async () => {
    const fetchNextPage = vi.fn();
    mockedUseDocumentsInfinite.mockReturnValue(
      mockReturn({
        data: {
          pages: [
            {
              documents: [
                { id: 'doc1', path: 'users/doc1', data: {}, createTime: null, updateTime: null },
              ],
              nextPageToken: 'page2',
            },
          ],
          pageParams: [null],
        },
        hasNextPage: true,
        fetchNextPage,
      } as unknown as Partial<InfReturn>),
    );

    const user = userEvent.setup();
    render(<CollectionTreeItem {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    const loadMore = screen.getByRole('button', { name: /load more/i });
    await user.click(loadMore);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });
});
