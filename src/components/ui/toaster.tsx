import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { useToast } from './use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';

function VariantIcon({ variant }: { variant?: string | null }) {
  if (variant === 'destructive') {
    return <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />;
  }
  if (variant === 'success') {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ember" />;
  }
  return null;
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <VariantIcon variant={variant} />
            <div className="min-w-0 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
