import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ShineBorder } from '@/components/ui/shine-border';

describe('ShineBorder', () => {
  it('renders children', () => {
    render(<ShineBorder><span>Hello</span></ShineBorder>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('applies className to outer wrapper', () => {
    const { container } = render(
      <ShineBorder className="custom-class"><span>Content</span></ShineBorder>,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses default amber color when no color prop is provided', () => {
    const { container } = render(<ShineBorder><span>Test</span></ShineBorder>);
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.background).toContain('#f59e0b');
  });

  it('accepts a custom color prop', () => {
    const { container } = render(
      <ShineBorder color="#ff0000"><span>Test</span></ShineBorder>,
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.background).toContain('#ff0000');
  });

  it('accepts a custom duration prop', () => {
    const { container } = render(
      <ShineBorder duration={5}><span>Test</span></ShineBorder>,
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer.style.animation).toContain('5s');
  });
});
