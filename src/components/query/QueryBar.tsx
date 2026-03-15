import { Bookmark, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QueryBuilder } from '@/components/query/QueryBuilder';
import { SavedQueryList } from '@/components/query/SavedQueryList';
import { useQueryStore } from '@/stores/query-store';
import type { QuerySpec } from '@/types/firestore';

export type QueryBarProps = {
  collectionPath: string;
  activeQuery: QuerySpec | null;
  onRunQuery: (query: QuerySpec) => void;
  onClearQuery: () => void;
  isQuerying: boolean;
  onSaveQuery: () => void;
  onLoadQuery: (spec: QuerySpec) => void;
};

export function QueryBar({
  collectionPath,
  activeQuery,
  onRunQuery,
  onClearQuery,
  isQuerying,
  onSaveQuery,
  onLoadQuery,
}: QueryBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const allQueries = useQueryStore((state) => state.queries);
  const deleteQuery = useQueryStore((state) => state.deleteQuery);
  const savedQueries = useMemo(
    () => allQueries.filter((q) => q.collectionPath === collectionPath),
    [allQueries, collectionPath],
  );
  const filterCount = activeQuery?.filters.length ?? 0;
  const [loadedQuery, setLoadedQuery] = useState<QuerySpec | null>(null);

  const handleLoadQuery = (spec: QuerySpec) => {
    setLoadedQuery(spec);
    setShowSaved(false);
    setExpanded(true);
    onLoadQuery(spec);
  };

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
        <Button
          variant={expanded ? 'secondary' : 'outline'}
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => {
            setExpanded(!expanded);
            setShowSaved(false);
          }}
        >
          <Search className="h-3 w-3" />
          Query
          {filterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {filterCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={showSaved ? 'secondary' : 'outline'}
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => {
            setShowSaved(!showSaved);
            setExpanded(false);
          }}
        >
          <Bookmark className="h-3 w-3" />
          Saved
          {savedQueries.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {savedQueries.length}
            </Badge>
          )}
        </Button>
        {activeQuery && (
          <span className="text-xs text-muted-foreground">
            Query active
            {activeQuery.filters.length > 0 &&
              ` — ${activeQuery.filters.length} filter${activeQuery.filters.length > 1 ? 's' : ''}`}
            {activeQuery.limit != null && ` — limit ${activeQuery.limit}`}
          </span>
        )}
      </div>
      {expanded && (
        <QueryBuilder
          collectionPath={collectionPath}
          onRunQuery={onRunQuery}
          onClearQuery={onClearQuery}
          isQuerying={isQuerying}
          onSaveQuery={onSaveQuery}
          initialQuery={loadedQuery}
        />
      )}
      {showSaved && (
        <div className="border-b border-white/[0.06] dark:bg-white/[0.02] bg-white/30 backdrop-blur-sm px-4 py-3">
          <SavedQueryList queries={savedQueries} onLoad={handleLoadQuery} onDelete={deleteQuery} />
        </div>
      )}
    </div>
  );
}
