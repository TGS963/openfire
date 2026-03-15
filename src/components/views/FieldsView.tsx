import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { FieldEditor } from '@/components/fields/FieldEditor';
import { detectFieldType, setValueAtPath, deleteValueAtPath } from '@/lib/field-types';

type FieldsViewProps = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  readonly?: boolean;
};

export function FieldsView({ data, onChange, readonly }: FieldsViewProps) {
  const keys = Object.keys(data);

  const handleFieldChange = (key: string, value: unknown) => {
    onChange({ ...data, [key]: value });
  };

  const handleDeleteField = (key: string) => {
    const { [key]: _, ...rest } = data;
    onChange(rest);
  };

  const handleAddField = () => {
    let fieldName = 'newField';
    let counter = 1;
    while (fieldName in data) {
      fieldName = `newField${counter++}`;
    }
    onChange({ ...data, [fieldName]: '' });
  };

  if (keys.length === 0 && !readonly) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8">
        <p className="text-sm text-muted-foreground">No fields</p>
        <Button variant="outline" size="sm" onClick={handleAddField}>
          <Plus className="mr-1 h-3 w-3" />
          Add field
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="divide-y divide-white/[0.04]">
        {keys.map((key) => (
          <FieldRow
            key={key}
            fieldName={key}
            value={data[key]}
            onChange={(value) => handleFieldChange(key, value)}
            onDelete={() => handleDeleteField(key)}
            onNestedChange={(path, value) => {
              const newData = setValueAtPath(data, [key, ...path], value);
              onChange(newData);
            }}
            onNestedDelete={(path) => {
              const newData = deleteValueAtPath(data, [key, ...path]);
              onChange(newData);
            }}
            readonly={readonly}
            depth={0}
          />
        ))}
      </div>
      {!readonly && (
        <div className="px-4 py-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleAddField}>
            <Plus className="mr-1 h-3 w-3" />
            Add field
          </Button>
        </div>
      )}
    </div>
  );
}

type FieldRowProps = {
  fieldName: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onDelete: () => void;
  onNestedChange: (path: (string | number)[], value: unknown) => void;
  onNestedDelete: (path: (string | number)[]) => void;
  readonly?: boolean;
  depth: number;
};

function FieldRow({
  fieldName,
  value,
  onChange,
  onDelete,
  onNestedChange,
  onNestedDelete,
  readonly,
  depth,
}: FieldRowProps) {
  const type = detectFieldType(value);
  const isExpandable = type === 'map' || type === 'array';
  const [expanded, setExpanded] = useState(false);

  const childEntries =
    type === 'map'
      ? Object.entries(value as Record<string, unknown>).filter(([k]) => !k.startsWith('__type'))
      : type === 'array'
        ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
        : [];

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/[0.04] transition-colors"
        style={{ paddingLeft: `${depth * 20 + 16}px` }}
      >
        {isExpandable ? (
          <button
            className="h-4 w-4 flex items-center justify-center shrink-0"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="h-4 w-4 shrink-0" />
        )}
        <span className="text-sm font-medium w-32 shrink-0 truncate">{fieldName}</span>
        <div className="flex-1 min-w-0">
          <FieldEditor value={value} onChange={onChange} />
        </div>
        {!readonly && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-destructive"
            onClick={onDelete}
            aria-label="Delete field"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {expanded &&
        childEntries.map(([childKey, childValue]) => (
          <FieldRow
            key={childKey}
            fieldName={childKey}
            value={childValue}
            onChange={(newValue) => onNestedChange([childKey], newValue)}
            onDelete={() => onNestedDelete([childKey])}
            onNestedChange={(path, newValue) =>
              onNestedChange([childKey, ...path], newValue)
            }
            onNestedDelete={(path) => onNestedDelete([childKey, ...path])}
            readonly={readonly}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}
