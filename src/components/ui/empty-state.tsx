import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: 'neutral' | 'destructive';
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  className = '',
}: EmptyStateProps) {
  const iconTone = tone === 'destructive' ? 'text-destructive' : 'text-text-faint';
  const titleTone = tone === 'destructive' ? 'text-destructive' : 'text-text';
  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-2 px-6 py-8 text-center ${className}`}
      role={tone === 'destructive' ? 'alert' : undefined}
    >
      <Icon className={`h-7 w-7 ${iconTone}`} aria-hidden />
      <p className={`text-sm font-medium ${titleTone}`}>{title}</p>
      {description && (
        <p className="max-w-md break-words text-[12.5px] text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}
