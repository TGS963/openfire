import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export type SaveNamedItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  itemLabel: string;
};

export function SaveNamedItemDialog({ open, onOpenChange, onSave, itemLabel }: SaveNamedItemDialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
    }
  }, [open]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save {itemLabel}</DialogTitle>
          <DialogDescription>Give this {itemLabel} a name so you can reuse it later.</DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${itemLabel.charAt(0).toUpperCase()}${itemLabel.slice(1)} name`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
