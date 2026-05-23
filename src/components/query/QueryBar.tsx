import { Bookmark, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QueryBuilder } from '@/components/query/QueryBuilder';
import type { QueryFilter, QuerySpec } from '@/types/firestore';

export type QueryBarProps = {
  collectionPath: string;
  activeQuery: QuerySpec | null;
  onRunQuery: (query: QuerySpec) => void;
  onClearQuery: () => void;
  isQuerying: boolean;
  onSaveQuery: () => void;
  onLoadQuery: (spec: QuerySpec) => void;
  matchCount?: number;
};

function displayValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function QueryBar({
  collectionPath,
  activeQuery,
  onRunQuery,
  onClearQuery,
  isQuerying,
  onSaveQuery,
  matchCount,
}: QueryBarProps) {
  const [expanded, setExpanded] = useState(false);
  const filters = activeQuery?.filters ?? [];

  const removeFilter = (index: number) => {
    if (!activeQuery) return;
    const next = activeQuery.filters.filter((_, i) => i !== index);
    if (next.length === 0) {
      onClearQuery();
    } else {
      onRunQuery({ ...activeQuery, filters: next });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-border-soft bg-surface-1 px-2.5 py-[7px] text-[12px]">
        {filters.map((f: QueryFilter, i) => (
          <span
            key={`${f.field}-${i}`}
            className="inline-flex h-6 items-center gap-1.5 rounded-md border border-border-soft bg-surface-2 px-2 font-mono text-[11.5px] text-text"
          >
            <span>{f.field}</span>
            <span className="font-medium text-ember-strong">{f.operator}</span>
            <span className="text-syn-string">{displayValue(f.value)}</span>
            <button
              type="button"
              aria-label={`Remove filter ${f.field}`}
              onClick={() => removeFilter(i)}
              className="pl-0.5 text-text-faint hover:text-text"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-dashed border-border px-2 text-[11.5px] text-text-muted hover:border-border-strong hover:text-text"
        >
          <Plus className="h-3 w-3" />
          Add filter
        </button>

        {matchCount != null && (
          <Badge dot variant="accent" className="ml-1">
            {matchCount} matches
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={onSaveQuery} disabled={!activeQuery}>
            <Bookmark className="mr-1 h-3 w-3" />
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearQuery} disabled={!activeQuery}>
            Clear
          </Button>
        </div>
      </div>

      {expanded && (
        <QueryBuilder
          collectionPath={collectionPath}
          onRunQuery={(spec) => {
            onRunQuery(spec);
            setExpanded(false);
          }}
          onClearQuery={onClearQuery}
          isQuerying={isQuerying}
          onSaveQuery={onSaveQuery}
          initialQuery={activeQuery}
        />
      )}
    </div>
  );
}
