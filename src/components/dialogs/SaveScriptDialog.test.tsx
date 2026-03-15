import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SaveScriptDialog } from '@/components/dialogs/SaveScriptDialog';

describe('SaveScriptDialog', () => {
  it('renders dialog when open', () => {
    render(<SaveScriptDialog open onOpenChange={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Save script')).toBeInTheDocument();
  });

  it('disables Save button when name is empty', () => {
    render(<SaveScriptDialog open onOpenChange={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('calls onSave with name on submit', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SaveScriptDialog open onOpenChange={vi.fn()} onSave={onSave} />);
    await user.type(screen.getByPlaceholderText('Script name'), 'My Script');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith('My Script');
  });

  it('calls onSave on Enter key', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<SaveScriptDialog open onOpenChange={vi.fn()} onSave={onSave} />);
    await user.type(screen.getByPlaceholderText('Script name'), 'Test{Enter}');
    expect(onSave).toHaveBeenCalledWith('Test');
  });

  it('closes on Cancel click', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<SaveScriptDialog open onOpenChange={onOpenChange} onSave={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
