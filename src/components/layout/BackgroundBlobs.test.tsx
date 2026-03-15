import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { BackgroundBlobs } from '@/components/layout/BackgroundBlobs';

describe('BackgroundBlobs', () => {
  it('renders without crashing', () => {
    const { container } = render(<BackgroundBlobs />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has pointer-events-none', () => {
    const { container } = render(<BackgroundBlobs />);
    expect(container.firstChild).toHaveClass('pointer-events-none');
  });

  it('renders three blob divs', () => {
    const { container } = render(<BackgroundBlobs />);
    const blobs = container.querySelectorAll('.animate-blob');
    expect(blobs).toHaveLength(3);
  });
});
