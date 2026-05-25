import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

import { useViewStore } from '@/stores/view-store';
import { DocumentListSection } from '@/components/documents/DocumentListSection';

vi.mock('react-virtuoso', () => ({
  Virtuoso: () => <div data-testid="virtuoso" />,
  TableVirtuoso: () => <div data-testid="table-virtuoso" />,
}));

const baseProps = {
  documents: [],
  isLoading: false,
  selectedPath: null,
  onSelect: vi.fn(),
  search: '',
  onSearchChange: vi.fn(),
  onCreateDocument: vi.fn(),
  onDuplicateDocument: vi.fn(),
};

describe('DocumentListSection', () => {
  it('renders empty state when no collection selected', () => {
    const { getByText } = render(
      <DocumentListSection {...baseProps} hasCollection={false} />,
    );
    expect(getByText('No collection selected')).toBeDefined();
  });

  it('renders error state', () => {
    const { getByText } = render(
      <DocumentListSection
        {...baseProps}
        hasCollection={true}
        error={new Error('boom')}
      />,
    );
    expect(getByText("Couldn't load documents")).toBeDefined();
  });

  it('does not crash when hasCollection flips false to true', () => {
    useViewStore.setState({ listMode: 'list' });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <DocumentListSection {...baseProps} hasCollection={false} />,
    );
    rerender(<DocumentListSection {...baseProps} hasCollection={true} />);
    const hookOrderWarning = errSpy.mock.calls.find((args) =>
      String(args[0] ?? '').match(/Rendered more hooks|static flag was missing|Rules of Hooks/i),
    );
    errSpy.mockRestore();
    expect(hookOrderWarning).toBeUndefined();
  });

  it('does not crash when error appears then clears', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <DocumentListSection {...baseProps} hasCollection={true} error={new Error('x')} />,
    );
    rerender(<DocumentListSection {...baseProps} hasCollection={true} />);
    const hookOrderWarning = errSpy.mock.calls.find((args) =>
      String(args[0] ?? '').match(/Rendered more hooks|static flag was missing|Rules of Hooks/i),
    );
    errSpy.mockRestore();
    expect(hookOrderWarning).toBeUndefined();
  });
});
