import { SaveNamedItemDialog } from '@/components/dialogs/SaveNamedItemDialog';
import type { SaveNamedItemDialogProps } from '@/components/dialogs/SaveNamedItemDialog';

export type SaveQueryDialogProps = Omit<SaveNamedItemDialogProps, 'itemLabel'>;

export function SaveQueryDialog(props: SaveQueryDialogProps) {
  return <SaveNamedItemDialog {...props} itemLabel="query" />;
}
