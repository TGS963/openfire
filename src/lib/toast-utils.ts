import { getErrorMessage } from '@/lib/error-utils';

export const toastError = (
  toast: (opts: { title: string; description: string; variant: 'destructive' }) => void,
  title: string,
  err: unknown,
) => toast({ title, description: getErrorMessage(err), variant: 'destructive' });
