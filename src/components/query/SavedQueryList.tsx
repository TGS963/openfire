import { Play, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { QuerySpec, SavedQuery } from '@/types/firestore';

type SavedQueryListProps = {
  queries: SavedQuery[];
  onLoad: (spec: QuerySpec) => void;
  onDelete: (id: string) => void;
};

export function SavedQueryList({ queries, onLoad, onDelete }: SavedQueryListProps) {
  if (queries.length === 0) {
    return <p className="text-sm text-muted-foreground px-2 py-3">No saved queries</p>;
  }

  return (
    <div className="space-y-1">
      {queries.map((q) => {
        const filterCount = q.filters.length;
        return (
          <div
            key={q.id}
            className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{q.name}</p>
              <p className="text-xs text-muted-foreground">
                {filterCount > 0 && `${filterCount} filter${filterCount > 1 ? 's' : ''}`}
                {filterCount > 0 && q.orderBy.length > 0 && ' · '}
                {q.orderBy.length > 0 && `${q.orderBy.length} sort`}
                {q.limit != null && ` · limit ${q.limit}`}
                {filterCount === 0 && q.orderBy.length === 0 && q.limit == null && 'No filters'}
              </p>
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  onLoad({
                    collectionPath: q.collectionPath,
                    filters: q.filters,
                    orderBy: q.orderBy,
                    limit: q.limit,
                  })
                }
                aria-label="Load query"
              >
                <Play className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => onDelete(q.id)}
                aria-label="Delete query"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
