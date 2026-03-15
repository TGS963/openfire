import { SaveNamedItemDialog } from '@/components/dialogs/SaveNamedItemDialog';
import type { SaveNamedItemDialogProps } from '@/components/dialogs/SaveNamedItemDialog';

export type SaveScriptDialogProps = Omit<SaveNamedItemDialogProps, 'itemLabel'>;

export function SaveScriptDialog(props: SaveScriptDialogProps) {
  return <SaveNamedItemDialog {...props} itemLabel="script" />;
}
