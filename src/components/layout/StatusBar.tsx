import { Fragment, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type StatusItem = {
  id: string;
  label: ReactNode;
};

export type StatusBarProps = {
  items: StatusItem[];
  right?: ReactNode;
  /** Fetching spinner — fixed slot on the right so toggling never shifts text. */
  loading?: boolean;
};

/** 24px bottom strip. Mono 11px, items separated by a gap + divider. */
export function StatusBar({ items, right, loading }: StatusBarProps) {
  return (
    <div className="flex h-6 flex-shrink-0 items-center gap-3.5 border-t border-border-soft bg-surface-1 px-2.5 font-mono text-[11px] text-text-muted">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 && <span data-sep className="h-3 w-px bg-border-soft" />}
          <span className="flex items-center gap-1.5">{item.label}</span>
        </Fragment>
      ))}
      <span className="ml-auto flex items-center gap-3.5">
        <span className="flex w-3 shrink-0 justify-center" aria-hidden={!loading}>
          {loading && (
            <Loader2 aria-label="Fetching" className="h-3 w-3 animate-spin text-ember" />
          )}
        </span>
        {right && (
          <span data-status-right className="flex items-center gap-1.5">
            {right}
          </span>
        )}
      </span>
    </div>
  );
}
