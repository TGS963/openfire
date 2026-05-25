import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';

import { CellEditor } from '@/components/views/CellEditor';
import { detectFieldType, type FieldType } from '@/lib/field-types';
import { useCellEditsStore } from '@/stores/cell-edits-store';
import type { FirestoreDocument } from '@/types/firestore';

const ID_COL_WIDTH = 220;
const DATA_COL_WIDTH = 180;

export type TableViewProps = {
  documents: FirestoreDocument[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onEditComplex?: (path: string) => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
};

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.__type === 'timestamp' || obj.__type__ === 'timestamp') {
      const seconds = obj.seconds as number;
      if (typeof seconds === 'number') {
        return new Date(seconds * 1000).toISOString();
      }
    }
    if (obj.__type === 'geo' || obj.__type__ === 'geo' || obj.__type__ === 'geopoint') {
      const lat = obj.lat ?? obj.latitude;
      const lng = obj.lng ?? obj.longitude;
      return `(${lat}, ${lng})`;
    }
    if (obj.__type === 'reference' || obj.__type__ === 'reference') {
      return `ref:${obj.path}`;
    }
    return '{...}';
  }
  return String(value);
}

function detectColumns(documents: FirestoreDocument[], maxScan = 50): string[] {
  const columnSet = new Set<string>();
  const limit = Math.min(documents.length, maxScan);
  for (let i = 0; i < limit; i++) {
    const data = documents[i].data;
    if (data && typeof data === 'object') {
      for (const key of Object.keys(data)) {
        columnSet.add(key);
      }
    }
  }
  return Array.from(columnSet).sort();
}

function synColorClass(type: FieldType): string {
  switch (type) {
    case 'string': return 'text-syn-string';
    case 'number': return 'text-syn-number';
    case 'boolean': return 'text-syn-bool';
    case 'timestamp': return 'text-syn-timestamp';
    case 'reference': return 'text-syn-key';
    default: return 'text-text-mid';
  }
}

const isEditableType = (t: FieldType) => t !== 'map' && t !== 'array';

export function TableView({
  documents,
  selectedPath,
  onSelect,
  onEditComplex,
  onEndReached,
  hasMore,
  isFetchingMore,
}: TableViewProps) {
  const columns = useMemo(() => detectColumns(documents), [documents]);

  // Deterministic table width + <colgroup> are the authoritative width source
  // under table-layout: fixed. Without them the leftover space oscillates per
  // frame during fast scroll, dragging fixed columns 1px via subpixel rounding.
  //
  // Memoized on column *count* only (not the `columns` array ref, which is a
  // fresh value on every refetch/load-more). A stable component identity keeps
  // Virtuoso from remounting the table mid-scroll when more docs append.
  const colCount = columns.length;
  const FixedTable = useMemo(
    () =>
      forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
        function FixedTable(props, ref) {
          return (
            <table
              {...props}
              ref={ref}
              style={{
                ...props.style,
                width: ID_COL_WIDTH + colCount * DATA_COL_WIDTH,
                minWidth: ID_COL_WIDTH + colCount * DATA_COL_WIDTH,
                tableLayout: 'fixed',
                borderCollapse: 'separate',
                borderSpacing: 0,
              }}
            >
              <colgroup>
                <col style={{ width: ID_COL_WIDTH }} />
                {Array.from({ length: colCount }, (_, i) => (
                  <col key={i} style={{ width: DATA_COL_WIDTH }} />
                ))}
              </colgroup>
              {props.children}
            </table>
          );
        },
      ),
    [colCount],
  );

  const pending = useCellEditsStore((s) => s.pending);
  const setPending = useCellEditsStore((s) => s.setPending);

  const [editing, setEditing] = useState<{ path: string; col: string } | null>(null);
  const [flashed, setFlashed] = useState<{ path: string; col: string } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  const editableColsFor = (doc: FirestoreDocument | undefined): string[] => {
    if (!doc) return [];
    return columns.filter((c) => isEditableType(detectFieldType(doc.data?.[c])));
  };

  // Enter on the selected row → edit first editable cell.
  useEffect(() => {
    if (!selectedPath) return;
    const handler = (e: KeyboardEvent) => {
      if (editing) return;
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
        // Don't swallow Enter on any focusable widget — buttons, links, tabs,
        // menu items rely on it to activate.
        if (target.closest('button, a, [role="button"], [role="menuitem"], [role="option"], [role="tab"]')) {
          return;
        }
      }
      const doc = documents.find((d) => d.path === selectedPath);
      const cols = editableColsFor(doc);
      if (!doc || cols.length === 0) return;
      e.preventDefault();
      setEditing({ path: doc.path, col: cols[0] });
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedPath, editing, documents, columns]);

  if (!documents.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        No documents to display.
      </div>
    );
  }

  const flashSuccess = (path: string, col: string) => {
    setFlashed({ path, col });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashed(null), 1000);
  };

  return (
    <div className="h-full w-full">
      <TableVirtuoso
        style={{ height: '100%', width: '100%', scrollbarGutter: 'stable' }}
        data={documents}
        endReached={() => {
          if (hasMore && !isFetchingMore) onEndReached?.();
        }}
        components={{
          Table: FixedTable,
          ...(isFetchingMore || hasMore
            ? {
                TableFoot: () => (
                  <tfoot>
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="border-t border-border-soft bg-surface-1 px-3 py-1.5 text-center text-[11px] text-text-muted"
                      >
                        {isFetchingMore ? 'Loading more…' : 'Scroll for more'}
                      </td>
                    </tr>
                  </tfoot>
                ),
              }
            : {}),
        }}
        fixedHeaderContent={() => (
          <tr className="bg-muted">
            <th
              style={{ width: ID_COL_WIDTH, minWidth: ID_COL_WIDTH }}
              className="sticky top-0 z-10 border-b border-r border-border-soft bg-surface-1 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
            >
              ID
            </th>
            {columns.map((col) => (
              <th
                key={col}
                style={{ width: DATA_COL_WIDTH, minWidth: DATA_COL_WIDTH }}
                className="sticky top-0 z-10 truncate border-b border-r border-border-soft bg-surface-1 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                title={col}
              >
                {col}
              </th>
            ))}
          </tr>
        )}
        itemContent={(_, doc) => {
          const isRowSelected = selectedPath === doc.path;
          const rowBg = isRowSelected
            ? 'bg-ember-bg text-ember-strong'
            : 'bg-surface hover:bg-surface-1';
          return (
            <>
              <td
                style={{ width: ID_COL_WIDTH, minWidth: ID_COL_WIDTH }}
                className={`cursor-pointer truncate border-b border-r px-3 py-2 text-[13px] font-medium ${rowBg}`}
                onClick={() => onSelect(doc.path)}
                title={doc.id}
              >
                {doc.id}
              </td>
              {columns.map((col) => {
                const isEditing = editing?.path === doc.path && editing?.col === col;
                const docPending = pending[doc.path];
                const hasPending = docPending && col in docPending;
                const baseValue = doc.data?.[col];
                const value = hasPending ? docPending[col] : baseValue;
                const type = detectFieldType(value);
                const editable = isEditableType(type);
                const isFlashed = flashed?.path === doc.path && flashed?.col === col;

                if (isEditing) {
                  return (
                    <td
                      key={col}
                      style={{ width: DATA_COL_WIDTH, minWidth: DATA_COL_WIDTH }}
                      className="relative overflow-visible border-b border-r border-border-soft bg-surface-3 p-0 shadow-[inset_0_0_0_1.5px_var(--accent)]"
                    >
                      <CellEditor
                        value={value}
                        type={type}
                        onCommit={(next) => {
                          const unchanged =
                            JSON.stringify(next) === JSON.stringify(baseValue);
                          if (unchanged) {
                            setEditing(null);
                            return;
                          }
                          setPending(doc.path, col, next);
                          setEditing(null);
                          flashSuccess(doc.path, col);
                        }}
                        onCancel={() => setEditing(null)}
                        onAdvance={(dir) => {
                          const cols = editableColsFor(doc);
                          const idx = cols.indexOf(col);
                          const nextIdx = idx + dir;
                          flashSuccess(doc.path, col);
                          if (nextIdx >= 0 && nextIdx < cols.length) {
                            setEditing({ path: doc.path, col: cols[nextIdx] });
                          } else {
                            setEditing(null);
                          }
                        }}
                      />
                    </td>
                  );
                }

                const text = formatCellValue(value);
                const colorClass = isRowSelected ? '' : synColorClass(type);
                const pendingClass = hasPending && !isRowSelected ? 'bg-ember-bg/40' : '';
                const flashClass = isFlashed
                  ? 'shadow-[inset_0_0_0_1px_var(--success)] bg-[oklch(0.74_0.13_150_/_0.10)]'
                  : '';
                return (
                  <td
                    key={col}
                    style={{ width: DATA_COL_WIDTH, minWidth: DATA_COL_WIDTH }}
                    className={`cursor-pointer truncate border-b border-r border-border-soft px-3 py-2 text-[13px] ${rowBg} ${colorClass} ${pendingClass} ${flashClass}`}
                    onClick={() => onSelect(doc.path)}
                    onDoubleClick={() => {
                      if (!editable) {
                        onEditComplex?.(doc.path);
                        return;
                      }
                      setEditing({ path: doc.path, col });
                    }}
                    title={hasPending ? `Unsaved — ⌘S to save\n${text}` : text}
                  >
                    {text}
                  </td>
                );
              })}
            </>
          );
        }}
      />
    </div>
  );
}
