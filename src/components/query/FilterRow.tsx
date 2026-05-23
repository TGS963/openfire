import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const FILTER_OPERATORS = [
  { value: '==', label: '==' },
  { value: '!=', label: '!=' },
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: 'array-contains', label: 'array-contains' },
  { value: 'in', label: 'in' },
  { value: 'array-contains-any', label: 'array-contains-any' },
  { value: 'not-in', label: 'not-in' },
] as const;

import type { FilterOperator } from '@/types/firestore';

export type FilterRowData = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
};

export type FilterRowProps = {
  filter: FilterRowData;
  onChange: (filter: FilterRowData) => void;
  onRemove: () => void;
};

export function FilterRow({ filter, onChange, onRemove }: FilterRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Field path"
        value={filter.field}
        onChange={(e) => onChange({ ...filter, field: e.target.value })}
        className="h-8 w-40 text-sm"
      />
      <Select
        value={filter.operator}
        onValueChange={(op) => onChange({ ...filter, operator: op as FilterOperator })}
      >
        <SelectTrigger className="h-8 w-40 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPERATORS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Value"
        value={filter.value}
        onChange={(e) => onChange({ ...filter, value: e.target.value })}
        className="h-8 flex-1 text-sm"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onRemove}
        aria-label="Remove filter"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
