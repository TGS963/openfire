import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  it('renders left items', () => {
    render(<StatusBar items={[{ id: 'proj', label: 'my-project' }, { id: 'count', label: '12,840 docs' }]} />);
    expect(screen.getByText('my-project')).toBeInTheDocument();
    expect(screen.getByText('12,840 docs')).toBeInTheDocument();
  });

  it('renders dividers between left items', () => {
    const { container } = render(
      <StatusBar items={[{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }, { id: 'c', label: 'c' }]} />,
    );
    // n items → n-1 dividers
    expect(container.querySelectorAll('[data-sep]')).toHaveLength(2);
  });

  it('renders a right-aligned region', () => {
    render(<StatusBar items={[{ id: 'a', label: 'a' }]} right={<span>idle</span>} />);
    const right = screen.getByText('idle').closest('[data-status-right]');
    expect(right).not.toBeNull();
  });

  it('shows a fetching indicator when loading', () => {
    render(<StatusBar items={[{ id: 'a', label: 'a' }]} loading />);
    expect(screen.getByLabelText('Fetching')).toBeInTheDocument();
  });

  it('hides the fetching indicator when not loading', () => {
    render(<StatusBar items={[{ id: 'a', label: 'a' }]} />);
    expect(screen.queryByLabelText('Fetching')).toBeNull();
  });
});
