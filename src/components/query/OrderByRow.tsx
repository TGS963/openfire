import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type OrderByRowData = {
  field: string;
  direction: 'asc' | 'desc';
};

export type OrderByRowProps = {
  orderBy: OrderByRowData;
  onChange: (orderBy: OrderByRowData) => void;
  onRemove: () => void;
};

export function OrderByRow({ orderBy, onChange, onRemove }: OrderByRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Field path"
        value={orderBy.field}
        onChange={(e) => onChange({ ...orderBy, field: e.target.value })}
        className="h-8 w-40 text-sm"
      />
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-xs"
        onClick={() =>
          onChange({ ...orderBy, direction: orderBy.direction === 'asc' ? 'desc' : 'asc' })
        }
        aria-label={`Sort ${orderBy.direction === 'asc' ? 'ascending' : 'descending'}`}
      >
        {orderBy.direction === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )}
        {orderBy.direction.toUpperCase()}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onRemove}
        aria-label="Remove order"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
