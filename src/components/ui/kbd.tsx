import * as React from 'react';

import { cn } from '@/lib/utils';

export type KbdProps = React.HTMLAttributes<HTMLElement>;

/**
 * Keyboard hint chip. 17px tall, mono 10.5px, bottom-heavy border.
 * Matches the design-handoff `.kbd` primitive.
 */
export function Kbd({ className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[17px] min-w-[16px] items-center justify-center rounded-[3px]',
        'border border-b-[1.5px] border-border-soft bg-surface-2 px-1',
        'font-mono text-[10.5px] font-medium text-text-muted',
        className,
      )}
      {...props}
    />
  );
}
