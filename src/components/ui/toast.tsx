import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-3 sm:bottom-0 sm:right-0 sm:top-auto sm:max-w-[420px] sm:flex-col',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-md border p-3 pr-8 shadow-pop transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-right-full sm:data-[state=closed]:slide-out-to-bottom-full',
  {
    variants: {
      variant: {
        default:
          'border-border bg-surface-2 text-text before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-border-strong',
        success:
          'border-ember-border bg-surface-2 text-text before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-ember',
        destructive:
          'destructive group border-[oklch(var(--destructive)/0.4)] bg-surface-2 text-text before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-1 px-2.5 text-[11.5px] font-medium text-text-mid transition-colors hover:border-border-strong hover:bg-surface-3 hover:text-text focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-sm text-text-faint opacity-0 transition-opacity hover:bg-surface-3 hover:text-text focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring group-hover:opacity-100',
      className,
    )}
    toast-close=""
    {...props}
  />
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn('text-[12.5px] font-medium leading-tight text-text', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn('mt-0.5 font-mono text-[11px] leading-snug text-text-muted', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, toastVariants };
