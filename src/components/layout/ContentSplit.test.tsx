import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ContentSplit } from '@/components/layout/ContentSplit';

describe('ContentSplit', () => {
  it('renders left content', () => {
    render(
      <ContentSplit
        left={<div>Left Panel</div>}
        right={<div>Right Panel</div>}
      />,
    );
    expect(screen.getByText('Left Panel')).toBeInTheDocument();
  });

  it('renders right content', () => {
    render(
      <ContentSplit
        left={<div>Left Panel</div>}
        right={<div>Right Panel</div>}
      />,
    );
    expect(screen.getByText('Right Panel')).toBeInTheDocument();
  });

  it('renders a resize handle', () => {
    render(
      <ContentSplit
        left={<div>Left</div>}
        right={<div>Right</div>}
      />,
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
