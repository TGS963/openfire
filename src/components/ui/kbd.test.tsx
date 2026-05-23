import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Kbd } from './kbd';

describe('Kbd', () => {
  it('renders its children', () => {
    render(<Kbd>⌘K</Kbd>);
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('renders as a <kbd> element', () => {
    render(<Kbd>esc</Kbd>);
    expect(screen.getByText('esc').tagName).toBe('KBD');
  });

  it('merges custom className', () => {
    render(<Kbd className="custom-x">⏎</Kbd>);
    expect(screen.getByText('⏎')).toHaveClass('custom-x');
  });
});
