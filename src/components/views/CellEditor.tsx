import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useCollections } from '@/hooks/firestore';
import type { FieldType } from '@/lib/field-types';

export type CellEditorProps = {
  value: unknown;
  type: FieldType;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
  /** Commit then move focus to the next/prev editable cell. */
  onAdvance?: (dir: 1 | -1) => void;
};

const tipKbdClass =
  'border-[var(--kbd-tip-border)] bg-[var(--kbd-tip-bg)] text-ember-fg';

function synColor(type: FieldType): string {
  switch (type) {
    case 'string': return 'text-syn-string';
    case 'number': return 'text-syn-number';
    case 'boolean': return 'text-syn-bool';
    case 'timestamp': return 'text-syn-timestamp';
    default: return 'text-text';
  }
}

function Tip({ type }: { type: FieldType }) {
  return (
    <div className="absolute left-[-1.5px] top-full z-10 flex items-center gap-2 rounded-b-sm bg-ember px-2 py-1 font-sans text-[10.5px] font-medium text-ember-fg pointer-events-none">
      <span>{type}</span>
      <Kbd className={tipKbdClass}>⏎</Kbd>
      <span>save</span>
      <Kbd className={tipKbdClass}>esc</Kbd>
      <span>cancel</span>
    </div>
  );
}

export function CellEditor({ value, type, onCommit, onCancel, onAdvance }: CellEditorProps) {
  if (type === 'boolean') {
    return <BoolEditor value={value} onCommit={onCommit} onCancel={onCancel} onAdvance={onAdvance} />;
  }
  if (type === 'timestamp') {
    return <TimestampEditor value={value} onCommit={onCommit} onCancel={onCancel} onAdvance={onAdvance} />;
  }
  if (type === 'reference') {
    return <ReferenceEditor value={value} onCommit={onCommit} onCancel={onCancel} onAdvance={onAdvance} />;
  }
  if (type === 'geopoint') {
    return <GeopointEditor value={value} onCommit={onCommit} onCancel={onCancel} onAdvance={onAdvance} />;
  }
  return <ScalarEditor value={value} type={type} onCommit={onCommit} onCancel={onCancel} onAdvance={onAdvance} />;
}

function ScalarEditor({ value, type, onCommit, onCancel, onAdvance }: CellEditorProps) {
  const initial = value == null ? '' : String(value);
  const [text, setText] = useState(initial);
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const tryCommit = (): boolean => {
    if (type === 'number') {
      const n = Number(text);
      if (text.trim() === '' || Number.isNaN(n)) {
        setInvalid(true);
        return false;
      }
      onCommit(n);
      return true;
    }
    onCommit(text);
    return true;
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      tryCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (tryCommit()) onAdvance?.(e.shiftKey ? -1 : 1);
    }
  };

  return (
    <div className="relative h-full w-full">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (invalid) setInvalid(false);
        }}
        onKeyDown={handleKey}
        onBlur={() => {
          // Commit-on-blur (click outside). Invalid input keeps the editor
          // open with the error ring so the user can fix it; pressing Escape
          // cancels explicitly.
          tryCommit();
        }}
        aria-invalid={invalid}
        className={`h-full w-full bg-transparent px-[10px] py-[6px] font-mono text-[12.5px] outline-none caret-ember ${synColor(
          type,
        )} ${invalid ? 'ring-1 ring-danger' : ''}`}
      />
      <Tip type={type} />
    </div>
  );
}

function BoolEditor({
  value,
  onCommit,
  onCancel,
  onAdvance,
}: Omit<CellEditorProps, 'type'>) {
  const [selected, setSelected] = useState<boolean>(Boolean(value));
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapRef.current?.focus();
  }, []);

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit(selected);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setSelected((v) => !v);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      onCommit(selected);
      onAdvance?.(e.shiftKey ? -1 : 1);
    }
  };

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={handleKey}
      onBlur={(e) => {
        // Click outside the bool wrapper → commit. Ignore blur to internal buttons.
        if (wrapRef.current && wrapRef.current.contains(e.relatedTarget as Node | null)) return;
        onCommit(selected);
      }}
      className="relative flex h-full items-center gap-1 px-2 outline-none"
    >
      {[true, false].map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => setSelected(opt)}
          className={`rounded-sm px-1.5 py-0.5 font-mono text-[12px] ${
            selected === opt
              ? 'bg-[oklch(0.76_0.16_300_/_0.2)] text-syn-bool'
              : 'text-text-muted'
          }`}
        >
          {String(opt)}
        </button>
      ))}
      <Tip type="boolean" />
    </div>
  );
}

type TsValue = { __type__: 'timestamp'; seconds: number; nanos: number };

function toTsValue(value: unknown): TsValue {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.seconds === 'number') {
      return {
        __type__: 'timestamp',
        seconds: obj.seconds,
        nanos: typeof obj.nanos === 'number' ? obj.nanos : 0,
      };
    }
  }
  return { __type__: 'timestamp', seconds: Math.floor(Date.now() / 1000), nanos: 0 };
}

function TimestampEditor({
  value,
  onCommit,
  onCancel,
  onAdvance,
}: Omit<CellEditorProps, 'type'>) {
  const initial = toTsValue(value);
  const initialDate = new Date(initial.seconds * 1000);
  const [date, setDate] = useState<Date>(initialDate);
  const pad = (n: number) => String(n).padStart(2, '0');
  const [time, setTime] = useState(`${pad(initialDate.getHours())}:${pad(initialDate.getMinutes())}`);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapRef.current?.focus();
  }, []);

  const commit = () => {
    const [h, m] = time.split(':').map((s) => parseInt(s, 10));
    const next = new Date(date);
    next.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0);
    onCommit({ __type__: 'timestamp', seconds: Math.floor(next.getTime() / 1000), nanos: 0 });
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commit();
      onAdvance?.(e.shiftKey ? -1 : 1);
    }
  };

  return (
    <div ref={wrapRef} tabIndex={0} onKeyDown={handleKey} className="relative h-full px-2 outline-none">
      <Popover
        open
        onOpenChange={(open) => {
          // Radix fires onOpenChange(false) on outside click / Esc.
          if (!open) commit();
        }}
      >
        <PopoverAnchor asChild>
          <span className="font-mono text-[12px] text-syn-timestamp">
            {date.toISOString().replace('T', ' ').replace(/\..+$/, '')}
          </span>
        </PopoverAnchor>
        <PopoverContent className="w-auto" align="start">
          <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} required={false} />
          <div className="mt-2 flex items-center gap-2 border-t border-border-soft pt-2">
            <span className="text-[10.5px] uppercase tracking-[0.06em] text-text-faint">time</span>
            <input
              aria-label="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-7 rounded-sm border border-border-soft bg-surface px-2 font-mono text-[12px] text-text"
            />
          </div>
        </PopoverContent>
      </Popover>
      <Tip type="timestamp" />
    </div>
  );
}

function ReferenceEditor({
  value,
  onCommit,
  onCancel,
  onAdvance,
}: Omit<CellEditorProps, 'type'>) {
  const ref = (value as { path?: string } | null) ?? {};
  const [path, setPath] = useState(ref.path ?? '');
  const { data } = useCollections();
  const suggestions = useMemo(() => data?.collectionIds ?? [], [data]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapRef.current?.focus();
  }, []);

  const commit = () => onCommit({ __type__: 'reference', path });

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commit();
      onAdvance?.(e.shiftKey ? -1 : 1);
    }
  };

  return (
    <div ref={wrapRef} tabIndex={-1} onKeyDown={handleKey} className="relative h-full outline-none">
      <Popover
        open
        onOpenChange={(open) => {
          if (!open) commit();
        }}
      >
        <PopoverAnchor asChild>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            autoFocus
            placeholder="collection/document"
            className="h-full w-full bg-transparent px-[10px] py-[6px] font-mono text-[12.5px] text-syn-key outline-none caret-ember"
          />
        </PopoverAnchor>
        <PopoverContent align="start" className="w-72 p-0">
          <Command>
            <CommandInput placeholder="filter collections…" />
            <CommandList>
              <CommandEmpty>No collections.</CommandEmpty>
              <CommandGroup heading="Collections">
                {suggestions.map((c) => (
                  <CommandItem key={c} value={c} onSelect={() => setPath(c)}>
                    {c}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Tip type="reference" />
    </div>
  );
}

function GeopointEditor({
  value,
  onCommit,
  onCancel,
  onAdvance,
}: Omit<CellEditorProps, 'type'>) {
  const obj = (value as Record<string, unknown> | null) ?? {};
  const [lat, setLat] = useState(String(obj.latitude ?? 0));
  const [lng, setLng] = useState(String(obj.longitude ?? 0));
  const latRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    latRef.current?.focus();
    latRef.current?.select();
  }, []);

  const commit = () => {
    const la = Number(lat);
    const lo = Number(lng);
    if (Number.isNaN(la) || Number.isNaN(lo)) return;
    onCommit({ __type__: 'geopoint', latitude: la, longitude: lo });
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commit();
      onAdvance?.(e.shiftKey ? -1 : 1);
    }
  };

  const wrapRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={wrapRef}
      onBlur={(e) => {
        if (wrapRef.current && wrapRef.current.contains(e.relatedTarget as Node | null)) return;
        commit();
      }}
      className="relative flex h-full items-center gap-1 px-2"
    >
      <input
        ref={latRef}
        aria-label="latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
        onKeyDown={handleKey}
        className="h-7 w-20 rounded-sm border border-border-soft bg-surface px-1.5 font-mono text-[12px] text-syn-number"
      />
      <input
        aria-label="longitude"
        value={lng}
        onChange={(e) => setLng(e.target.value)}
        onKeyDown={handleKey}
        className="h-7 w-20 rounded-sm border border-border-soft bg-surface px-1.5 font-mono text-[12px] text-syn-number"
      />
      <Tip type="geopoint" />
    </div>
  );
}
