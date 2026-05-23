import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn('rdp-token p-2', className)}
      classNames={{
        root: 'text-[12.5px] text-text',
        months: 'flex flex-col gap-2',
        month: 'space-y-2',
        caption_label: 'text-[12.5px] font-medium text-text',
        nav: 'flex items-center gap-1',
        button_previous:
          'inline-flex h-6 w-6 items-center justify-center rounded-sm text-text-muted hover:bg-surface-3 hover:text-text',
        button_next:
          'inline-flex h-6 w-6 items-center justify-center rounded-sm text-text-muted hover:bg-surface-3 hover:text-text',
        day_button:
          'h-7 w-7 rounded-sm text-[12px] text-text-mid hover:bg-surface-3 hover:text-text',
        weekday: 'text-[10.5px] font-medium uppercase tracking-[0.06em] text-text-faint',
        day: 'h-7 w-7 rounded-sm text-[12px] text-text-mid hover:bg-surface-3 hover:text-text',
        selected: 'bg-ember text-ember-fg hover:bg-ember-strong hover:text-ember-fg',
        today: 'text-ember-strong',
        outside: 'text-text-faint',
        disabled: 'opacity-40',
        ...(classNames ?? {}),
      }}
      {...props}
    />
  );
}
