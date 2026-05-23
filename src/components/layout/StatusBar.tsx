import { Fragment, type ReactNode } from 'react';

export type StatusItem = {
  id: string;
  label: ReactNode;
};

export type StatusBarProps = {
  items: StatusItem[];
  right?: ReactNode;
};

/** 24px bottom strip. Mono 11px, items separated by a gap + divider. */
export function StatusBar({ items, right }: StatusBarProps) {
  return (
    <div className="flex h-6 flex-shrink-0 items-center gap-3.5 border-t border-border-soft bg-surface-1 px-2.5 font-mono text-[11px] text-text-muted">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 && <span data-sep className="h-3 w-px bg-border-soft" />}
          <span className="flex items-center gap-1.5">{item.label}</span>
        </Fragment>
      ))}
      {right && (
        <span data-status-right className="ml-auto flex items-center gap-1.5">
          {right}
        </span>
      )}
    </div>
  );
}
