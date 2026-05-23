import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>12,840 docs</Badge>);
    expect(screen.getByText('12,840 docs')).toBeInTheDocument();
  });

  it('applies accent variant classes', () => {
    render(<Badge variant="accent">PROD</Badge>);
    expect(screen.getByText('PROD')).toHaveClass('text-ember-strong');
  });

  it('adds a dot pseudo-element when dot is set', () => {
    render(<Badge dot>318 matches</Badge>);
    const el = screen.getByText('318 matches');
    expect(el.className).toContain("before:content-['']");
  });
});
