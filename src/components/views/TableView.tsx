import { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';

import type { FirestoreDocument } from '@/types/firestore';

export type TableViewProps = {
  documents: FirestoreDocument[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
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
    if (obj.__type === 'geo' || obj.__type__ === 'geo') {
      return `(${obj.lat}, ${obj.lng})`;
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

export function TableView({ documents, selectedPath, onSelect }: TableViewProps) {
  const columns = useMemo(() => detectColumns(documents), [documents]);

  if (!documents.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        No documents to display.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <TableVirtuoso
        style={{ height: '100%', width: '100%' }}
        data={documents}
        fixedHeaderContent={() => (
          <tr className="bg-muted">
            <th className="sticky top-0 border-b border-r dark:border-white/[0.06] border-black/[0.06] bg-muted px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              ID
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="sticky top-0 border-b border-r dark:border-white/[0.06] border-black/[0.06] bg-muted px-3 py-2 text-left text-xs font-medium text-muted-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        )}
        itemContent={(_, doc) => (
          <>
            <td
              className={`cursor-pointer border-b border-r px-3 py-2 text-sm font-medium ${
                selectedPath === doc.path ? 'bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'bg-background hover:bg-white/[0.06]'
              }`}
              onClick={() => onSelect(doc.path)}
            >
              {doc.id}
            </td>
            {columns.map((col) => (
              <td
                key={col}
                className={`cursor-pointer border-b border-r px-3 py-2 text-sm ${
                  selectedPath === doc.path ? 'bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'bg-background hover:bg-white/[0.06]'
                }`}
                onClick={() => onSelect(doc.path)}
              >
                {formatCellValue(doc.data?.[col])}
              </td>
            ))}
          </>
        )}
      />
    </div>
  );
}
