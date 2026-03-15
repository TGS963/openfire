import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { TableView } from '@/components/views/TableView';
import type { FirestoreDocument } from '@/types/firestore';

// Mock react-virtuoso since it needs DOM measurements
vi.mock('react-virtuoso', () => ({
  TableVirtuoso: ({
    data,
    fixedHeaderContent,
    itemContent,
  }: {
    data: FirestoreDocument[];
    fixedHeaderContent: () => React.ReactNode;
    itemContent: (index: number, item: FirestoreDocument) => React.ReactNode;
  }) => (
    <table>
      <thead>{fixedHeaderContent()}</thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={item.id}>{itemContent(index, item)}</tr>
        ))}
      </tbody>
    </table>
  ),
}));

const makeDocs = (overrides?: Partial<FirestoreDocument>[]): FirestoreDocument[] =>
  (overrides ?? []).map((o, i) => ({
    id: `doc${i + 1}`,
    path: `users/doc${i + 1}`,
    data: {},
    createTime: null,
    updateTime: null,
    ...o,
  }));

describe('TableView', () => {
  it('shows empty message when no documents', () => {
    render(<TableView documents={[]} selectedPath={null} onSelect={vi.fn()} />);
    expect(screen.getByText('No documents to display.')).toBeInTheDocument();
  });

  it('renders document IDs in the table', () => {
    const docs = makeDocs([
      { id: 'user1', data: { name: 'Alice' } },
      { id: 'user2', data: { name: 'Bob' } },
    ]);
    render(<TableView documents={docs} selectedPath={null} onSelect={vi.fn()} />);
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
  });

  it('detects columns from document data', () => {
    const docs = makeDocs([
      { data: { name: 'Alice', age: 30 } },
      { data: { name: 'Bob', email: 'bob@test.com' } },
    ]);
    render(<TableView documents={docs} selectedPath={null} onSelect={vi.fn()} />);
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  it('formats cell values correctly', () => {
    const docs = makeDocs([
      {
        data: {
          name: 'Alice',
          age: 30,
          active: true,
          tags: ['a', 'b'],
          address: { city: 'NYC' },
          nothing: null,
        },
      },
    ]);
    render(<TableView documents={docs} selectedPath={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('[2 items]')).toBeInTheDocument();
    expect(screen.getByText('{...}')).toBeInTheDocument();
  });

  it('always shows ID column header', () => {
    const docs = makeDocs([{ data: { name: 'Alice' } }]);
    render(<TableView documents={docs} selectedPath={null} onSelect={vi.fn()} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
  });
});
