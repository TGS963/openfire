import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AboutDialog } from '@/components/dialogs/AboutDialog';

describe('AboutDialog', () => {
  it('renders app name and description when open', () => {
    render(<AboutDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText('OpenFire')).toBeInTheDocument();
    expect(screen.getByText('Desktop Firestore Manager')).toBeInTheDocument();
  });

  it('renders version info', () => {
    render(<AboutDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText(/^v\d+\.\d+\.\d+$/)).toBeInTheDocument();
  });
});
