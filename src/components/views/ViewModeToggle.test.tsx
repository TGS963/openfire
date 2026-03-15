import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';

import { ListModeToggle, PreviewModeToggle } from '@/components/views/ViewModeToggle';
import { useViewStore } from '@/stores/view-store';

describe('ListModeToggle', () => {
  beforeEach(() => {
    useViewStore.setState({ listMode: 'list', previewMode: 'json' });
  });

  it('renders List and Table tabs', () => {
    render(<ListModeToggle />);
    expect(screen.getByRole('tab', { name: 'List' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Table' })).toBeInTheDocument();
  });

  it('has List tab selected by default', () => {
    render(<ListModeToggle />);
    expect(screen.getByRole('tab', { name: 'List' })).toHaveAttribute('data-state', 'active');
  });

  it('switches to table mode when Table tab is clicked', async () => {
    const user = userEvent.setup();
    render(<ListModeToggle />);
    await user.click(screen.getByRole('tab', { name: 'Table' }));
    expect(useViewStore.getState().listMode).toBe('table');
  });

  it('switches back to list mode when List tab is clicked', async () => {
    useViewStore.setState({ listMode: 'table' });
    const user = userEvent.setup();
    render(<ListModeToggle />);
    await user.click(screen.getByRole('tab', { name: 'List' }));
    expect(useViewStore.getState().listMode).toBe('list');
  });
});

describe('PreviewModeToggle', () => {
  beforeEach(() => {
    useViewStore.setState({ listMode: 'list', previewMode: 'json' });
  });

  it('renders JSON and Fields tabs', () => {
    render(<PreviewModeToggle />);
    expect(screen.getByRole('tab', { name: 'JSON' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Fields' })).toBeInTheDocument();
  });

  it('has JSON tab selected by default', () => {
    render(<PreviewModeToggle />);
    expect(screen.getByRole('tab', { name: 'JSON' })).toHaveAttribute('data-state', 'active');
  });

  it('switches to fields mode when Fields tab is clicked', async () => {
    const user = userEvent.setup();
    render(<PreviewModeToggle />);
    await user.click(screen.getByRole('tab', { name: 'Fields' }));
    expect(useViewStore.getState().previewMode).toBe('fields');
  });

  it('switches back to json mode when JSON tab is clicked', async () => {
    useViewStore.setState({ previewMode: 'fields' });
    const user = userEvent.setup();
    render(<PreviewModeToggle />);
    await user.click(screen.getByRole('tab', { name: 'JSON' }));
    expect(useViewStore.getState().previewMode).toBe('json');
  });
});
