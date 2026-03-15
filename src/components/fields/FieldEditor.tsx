import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { detectFieldType, defaultValueForType, type FieldType } from '@/lib/field-types';

const FIELD_TYPES: FieldType[] = [
  'string',
  'number',
  'boolean',
  'null',
  'array',
  'map',
  'timestamp',
  'geopoint',
  'reference',
];

type FieldEditorProps = {
  value: unknown;
  onChange: (value: unknown) => void;
};

export function FieldEditor({ value, onChange }: FieldEditorProps) {
  const type = detectFieldType(value);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const handleTypeChange = (newType: FieldType) => {
    setShowTypeMenu(false);
    if (newType !== type) {
      onChange(defaultValueForType(newType));
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative">
        <Badge
          variant="outline"
          className="cursor-pointer text-[10px] shrink-0"
          onClick={() => setShowTypeMenu(!showTypeMenu)}
        >
          {type}
        </Badge>
        {showTypeMenu && (
          <div className="absolute top-full left-0 z-50 mt-1 rounded-md border bg-popover p-1 shadow-md">
            {FIELD_TYPES.map((t) => (
              <button
                key={t}
                className="block w-full px-3 py-1 text-left text-xs hover:bg-muted rounded-sm"
                onClick={() => handleTypeChange(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <FieldValueEditor type={type} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function FieldValueEditor({
  type,
  value,
  onChange,
}: {
  type: FieldType;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (type) {
    case 'string':
      return (
        <Input
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs"
        />
      );
    case 'number':
      return (
        <Input
          type="number"
          value={String(value ?? 0)}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onChange(Number.isNaN(n) ? 0 : n);
          }}
          className="h-7 text-xs"
        />
      );
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
      );
    case 'null':
      return <span className="text-xs text-muted-foreground italic">null</span>;
    case 'array':
      return (
        <span className="text-xs text-muted-foreground">
          {Array.isArray(value) ? `${value.length} items` : '0 items'}
        </span>
      );
    case 'map':
      return (
        <span className="text-xs text-muted-foreground">
          {value && typeof value === 'object' && !Array.isArray(value)
            ? `${Object.keys(value).filter((k) => !k.startsWith('__type')).length} keys`
            : '0 keys'}
        </span>
      );
    case 'timestamp': {
      const ts = value as Record<string, unknown>;
      return (
        <div className="flex gap-1">
          <Input
            type="number"
            value={String(ts?.seconds ?? 0)}
            onChange={(e) =>
              onChange({ ...ts, seconds: parseInt(e.target.value, 10) || 0 })
            }
            className="h-7 text-xs w-28"
            placeholder="seconds"
          />
          <Input
            type="number"
            value={String(ts?.nanos ?? 0)}
            onChange={(e) =>
              onChange({ ...ts, nanos: parseInt(e.target.value, 10) || 0 })
            }
            className="h-7 text-xs w-28"
            placeholder="nanos"
          />
        </div>
      );
    }
    case 'geopoint': {
      const geo = value as Record<string, unknown>;
      return (
        <div className="flex gap-1">
          <Input
            type="number"
            value={String(geo?.latitude ?? 0)}
            onChange={(e) =>
              onChange({ ...geo, latitude: parseFloat(e.target.value) || 0 })
            }
            className="h-7 text-xs w-28"
            placeholder="latitude"
          />
          <Input
            type="number"
            value={String(geo?.longitude ?? 0)}
            onChange={(e) =>
              onChange({ ...geo, longitude: parseFloat(e.target.value) || 0 })
            }
            className="h-7 text-xs w-28"
            placeholder="longitude"
          />
        </div>
      );
    }
    case 'reference': {
      const ref = value as Record<string, unknown>;
      return (
        <Input
          value={String(ref?.path ?? '')}
          onChange={(e) => onChange({ ...ref, path: e.target.value })}
          className="h-7 text-xs"
          placeholder="collection/document"
        />
      );
    }
  }
}
