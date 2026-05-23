import { ListFilter, ArrowUpDown, Play, X, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FilterRow, type FilterRowData } from '@/components/query/FilterRow';
import { OrderByRow, type OrderByRowData } from '@/components/query/OrderByRow';
import type { QuerySpec } from '@/types/firestore';

export type QueryBuilderProps = {
  collectionPath: string;
  onRunQuery: (query: QuerySpec) => void;
  onClearQuery: () => void;
  isQuerying: boolean;
  onSaveQuery?: () => void;
  initialQuery?: QuerySpec | null;
};

function parseFilterValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  const num = Number(trimmed);
  if (trimmed !== '' && !Number.isNaN(num)) return num;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) || typeof parsed === 'object') return parsed;
  } catch {
    // not JSON, treat as string
  }
  return trimmed;
}

export function QueryBuilder({
  collectionPath,
  onRunQuery,
  onClearQuery,
  isQuerying,
  onSaveQuery,
  initialQuery,
}: QueryBuilderProps) {
  const [filters, setFilters] = useState<FilterRowData[]>([]);
  const [orderBys, setOrderBys] = useState<OrderByRowData[]>([]);
  const [limit, setLimit] = useState('');

  useEffect(() => {
    if (initialQuery) {
      setFilters(
        initialQuery.filters.map((f) => ({
          id: crypto.randomUUID(),
          field: f.field,
          operator: f.operator,
          value: typeof f.value === 'string' ? f.value : JSON.stringify(f.value),
        })),
      );
      setOrderBys(
        initialQuery.orderBy.map((o) => ({
          id: crypto.randomUUID(),
          field: o.field,
          direction: o.direction,
        })),
      );
      setLimit(initialQuery.limit != null ? String(initialQuery.limit) : '');
    }
  }, [initialQuery]);

  const addFilter = () => {
    setFilters([...filters, { id: crypto.randomUUID(), field: '', operator: '==', value: '' }]);
  };

  const addOrderBy = () => {
    setOrderBys([...orderBys, { id: crypto.randomUUID(), field: '', direction: 'asc' }]);
  };

  const updateFilter = (id: string, updated: FilterRowData) => {
    setFilters(filters.map((f) => (f.id === id ? updated : f)));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateOrderBy = (id: string, updated: OrderByRowData) => {
    setOrderBys(orderBys.map((o) => (o.id === id ? updated : o)));
  };

  const removeOrderBy = (id: string) => {
    setOrderBys(orderBys.filter((o) => o.id !== id));
  };

  const handleRun = () => {
    const validFilters = filters
      .filter((f) => f.field.trim() && f.value.trim())
      .map((f) => ({
        field: f.field.trim(),
        operator: f.operator,
        value: parseFilterValue(f.value),
      }));

    const validOrderBys = orderBys
      .filter((o) => o.field.trim())
      .map((o) => ({
        field: o.field.trim(),
        direction: o.direction,
      }));

    const parsedLimit = limit.trim() ? parseInt(limit.trim(), 10) : undefined;

    onRunQuery({
      collectionPath,
      filters: validFilters,
      orderBy: validOrderBys,
      limit: parsedLimit && !Number.isNaN(parsedLimit) ? parsedLimit : undefined,
    });
  };

  const handleClear = () => {
    setFilters([]);
    setOrderBys([]);
    setLimit('');
    onClearQuery();
  };

  return (
    <div className="space-y-3 border-b border-white/[0.06] dark:bg-white/[0.02] bg-white/30 backdrop-blur-sm px-4 py-3">
      <div className="space-y-2">
        {filters.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ListFilter className="h-3 w-3" />
              Filters
            </p>
            {filters.map((filter) => (
              <FilterRow
                key={filter.id}
                filter={filter}
                onChange={(updated) => updateFilter(filter.id, updated)}
                onRemove={() => removeFilter(filter.id)}
              />
            ))}
          </div>
        )}

        {orderBys.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ArrowUpDown className="h-3 w-3" />
              Order By
            </p>
            {orderBys.map((orderBy) => (
              <OrderByRow
                key={orderBy.id}
                orderBy={orderBy}
                onChange={(updated) => updateOrderBy(orderBy.id, updated)}
                onRemove={() => removeOrderBy(orderBy.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addFilter}>
          + Filter
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addOrderBy}>
          + Order By
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Limit:</span>
          <Input
            type="number"
            placeholder="—"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="h-7 w-20 text-xs"
            min={1}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClear}>
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
          {onSaveQuery && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onSaveQuery}
              disabled={filters.length === 0 && orderBys.length === 0}
            >
              <Save className="mr-1 h-3 w-3" />
              Save
            </Button>
          )}
          <Button size="sm" className="h-7 text-xs" onClick={handleRun} disabled={isQuerying}>
            <Play className="mr-1 h-3 w-3" />
            Run Query
          </Button>
        </div>
      </div>
    </div>
  );
}
