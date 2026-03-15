import { invoke } from '@tauri-apps/api/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ImportCollectionDialog } from '@/components/dialogs/ImportCollectionDialog';

const mockedInvoke = vi.mocked(invoke);

// Mock the Tauri dialog plugin's open function
const mockDialogOpen = vi.fn();
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: (...args: unknown[]) => mockDialogOpen(...args),
}));

describe('ImportCollectionDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    collectionPath: 'users',
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with collection name', () => {
    render(<ImportCollectionDialog {...defaultProps} />);
    expect(screen.getByText('Import collection')).toBeInTheDocument();
    expect(screen.getByText(/users/)).toBeInTheDocument();
  });

  it('renders import mode radio buttons', () => {
    render(<ImportCollectionDialog {...defaultProps} />);
    expect(screen.getByLabelText(/Create only/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Overwrite/)).toBeInTheDocument();
  });

  it('defaults to create_only mode', () => {
    render(<ImportCollectionDialog {...defaultProps} />);
    const createOnly = screen.getByLabelText(/Create only/) as HTMLInputElement;
    expect(createOnly.checked).toBe(true);
  });

  it('disables Import button when no file is selected', () => {
    render(<ImportCollectionDialog {...defaultProps} />);
    const importButton = screen.getByRole('button', { name: 'Import' });
    expect(importButton).toBeDisabled();
  });

  it('opens file picker when Choose file is clicked', async () => {
    const user = userEvent.setup();
    mockDialogOpen.mockResolvedValueOnce('/tmp/data.json');
    render(<ImportCollectionDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Choose file/ }));
    expect(mockDialogOpen).toHaveBeenCalled();
  });

  it('shows selected file name after choosing a file', async () => {
    const user = userEvent.setup();
    mockDialogOpen.mockResolvedValueOnce('/home/user/data.json');
    render(<ImportCollectionDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Choose file/ }));
    expect(screen.getByText('data.json')).toBeInTheDocument();
  });

  it('enables Import button after file is selected', async () => {
    const user = userEvent.setup();
    mockDialogOpen.mockResolvedValueOnce('/tmp/data.json');
    render(<ImportCollectionDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Choose file/ }));
    const importButton = screen.getByRole('button', { name: 'Import' });
    expect(importButton).not.toBeDisabled();
  });

  it('calls onSubmit with file path and mode', async () => {
    const user = userEvent.setup();
    mockDialogOpen.mockResolvedValueOnce('/tmp/data.json');
    render(<ImportCollectionDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Choose file/ }));
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      filePath: '/tmp/data.json',
      mode: 'create_only',
    });
  });

  it('submits with overwrite mode when selected', async () => {
    const user = userEvent.setup();
    mockDialogOpen.mockResolvedValueOnce('/tmp/data.json');
    render(<ImportCollectionDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Choose file/ }));
    await user.click(screen.getByLabelText(/Overwrite/));
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      filePath: '/tmp/data.json',
      mode: 'overwrite',
    });
  });

  it('calls onOpenChange when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ImportCollectionDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables buttons when isSubmitting is true', () => {
    render(<ImportCollectionDialog {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Choose file/ })).toBeDisabled();
  });

  it('does not render when closed', () => {
    render(<ImportCollectionDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Import collection')).not.toBeInTheDocument();
  });

  it('handles file picker returning array', async () => {
    const user = userEvent.setup();
    mockDialogOpen.mockResolvedValueOnce(['/tmp/first.json', '/tmp/second.json']);
    render(<ImportCollectionDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Choose file/ }));
    expect(screen.getByText('first.json')).toBeInTheDocument();
  });

  it('falls back to invoke when dialog plugin fails', async () => {
    const user = userEvent.setup();
    mockDialogOpen.mockRejectedValueOnce(new Error('Plugin not found'));
    mockedInvoke.mockResolvedValueOnce('/tmp/fallback.json');
    render(<ImportCollectionDialog {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /Choose file/ }));
    expect(screen.getByText('fallback.json')).toBeInTheDocument();
  });
});
