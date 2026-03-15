import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ShortcutsHelpDialog } from '@/components/dialogs/ShortcutsHelpDialog';
import { SHORTCUTS } from '@/lib/keyboard-shortcuts';

describe('ShortcutsHelpDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  it('renders all shortcuts', () => {
    render(<ShortcutsHelpDialog {...defaultProps} />);
    for (const shortcut of SHORTCUTS) {
      expect(screen.getByText(shortcut.description)).toBeInTheDocument();
    }
  });

  it('groups shortcuts by category', () => {
    render(<ShortcutsHelpDialog {...defaultProps} />);
    const categories = [...new Set(SHORTCUTS.map((s) => s.category))];
    for (const category of categories) {
      expect(screen.getByText(category)).toBeInTheDocument();
    }
  });

  it('does not render when closed', () => {
    render(<ShortcutsHelpDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Keyboard shortcuts')).not.toBeInTheDocument();
  });

  it('shows shortcut key hints', () => {
    render(<ShortcutsHelpDialog {...defaultProps} />);
    // Should show at least one formatted shortcut (Ctrl+s or ⌘s)
    expect(screen.getByText(/Ctrl\+s|⌘s/)).toBeInTheDocument();
  });
});
