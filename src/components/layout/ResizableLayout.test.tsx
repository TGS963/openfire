import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ResizableLayout } from '@/components/layout/ResizableLayout';

describe('ResizableLayout', () => {
  it('renders sidebar content', () => {
    render(
      <ResizableLayout
        sidebarContent={<div>Sidebar Content</div>}
        mainContent={<div>Main Content</div>}
      />,
    );
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
  });

  it('renders main content', () => {
    render(
      <ResizableLayout
        sidebarContent={<div>Sidebar Content</div>}
        mainContent={<div>Main Content</div>}
      />,
    );
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('renders a resize handle', () => {
    render(
      <ResizableLayout
        sidebarContent={<div>Sidebar</div>}
        mainContent={<div>Main</div>}
      />,
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
