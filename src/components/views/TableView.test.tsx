import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TableView } from '@/components/views/TableView';
import { useCellEditsStore } from '@/stores/cell-edits-store';
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

beforeEach(() => {
  useCellEditsStore.setState({ pending: {} });
});

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

  describe('inline editing', () => {
    it('enters edit mode on double-click of an editable cell', async () => {
      const user = userEvent.setup();
      const docs = makeDocs([{ id: 'u1', data: { age: 30 } }]);
      render(<TableView documents={docs} selectedPath={null} onSelect={vi.fn()} />);
      await user.dblClick(screen.getByText('30'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('stages a pending edit on Enter and shows the new value', async () => {
      const user = userEvent.setup();
      const docs = makeDocs([{ id: 'u1', data: { age: 30 } }]);
      render(<TableView documents={docs} selectedPath={null} onSelect={vi.fn()} />);
      await user.dblClick(screen.getByText('30'));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, '42{Enter}');
      expect(useCellEditsStore.getState().getPending('users/doc1', 'age')).toEqual({ value: 42 });
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('closes (commit-on-blur) when the user clicks outside', async () => {
      const user = userEvent.setup();
      const docs = makeDocs([{ data: { name: 'Ada' } }]);
      render(
        <>
          <button>Outside</button>
          <TableView documents={docs} selectedPath={null} onSelect={vi.fn()} />
        </>,
      );
      await user.dblClick(screen.getByText('Ada'));
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'Bob');
      await user.click(screen.getByText('Outside'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(useCellEditsStore.getState().getPending('users/doc1', 'name')).toEqual({ value: 'Bob' });
    });

    it('cancels on Escape without staging', async () => {
      const user = userEvent.setup();
      const docs = makeDocs([{ id: 'u1', data: { age: 30 } }]);
      render(<TableView documents={docs} selectedPath={null} onSelect={vi.fn()} />);
      await user.dblClick(screen.getByText('30'));
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(useCellEditsStore.getState().pendingCount()).toBe(0);
    });

    it('Enter on selected row edits first editable cell', async () => {
      const user = userEvent.setup();
      const docs = makeDocs([{ data: { age: 30, name: 'Ada' } }]);
      render(<TableView documents={docs} selectedPath="users/doc1" onSelect={vi.fn()} />);
      await user.keyboard('{Enter}');
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not hijack Enter when a button is focused', async () => {
      const user = userEvent.setup();
      const docs = makeDocs([{ data: { age: 30 } }]);
      const onClick = vi.fn();
      render(
        <>
          <button onClick={onClick}>Outside</button>
          <TableView documents={docs} selectedPath="users/doc1" onSelect={vi.fn()} />
        </>,
      );
      screen.getByText('Outside').focus();
      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('Tab advances to the next editable cell', async () => {
      const user = userEvent.setup();
      const docs = makeDocs([{ data: { age: 30, name: 'Ada' } }]);
      render(<TableView documents={docs} selectedPath="users/doc1" onSelect={vi.fn()} />);
      await user.dblClick(screen.getByText('30'));
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, '42');
      await user.keyboard('{Tab}');
      // age committed, now name editor open with "Ada" preselected
      expect(useCellEditsStore.getState().getPending('users/doc1', 'age')).toEqual({ value: 42 });
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Ada');
    });

    it('opens the Fields editor for map/array cells via onEditComplex', async () => {
      const user = userEvent.setup();
      const onEditComplex = vi.fn();
      const docs = makeDocs([{ id: 'u1', data: { tags: ['a', 'b'] } }]);
      render(
        <TableView
          documents={docs}
          selectedPath={null}
          onSelect={vi.fn()}
          onEditComplex={onEditComplex}
        />,
      );
      await user.dblClick(screen.getByText('[2 items]'));
      expect(onEditComplex).toHaveBeenCalledWith('users/doc1');
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });
});
