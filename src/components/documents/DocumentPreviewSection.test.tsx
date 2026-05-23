import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useViewStore } from '@/stores/view-store';
import { useDocDraftsStore } from '@/stores/doc-drafts-store';
import type { FirestoreDocument } from '@/types/firestore';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="monaco-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { DocumentPreviewSection } from '@/components/documents/DocumentPreviewSection';

const doc: FirestoreDocument = {
  id: 'k4eD2Lq9xMo8',
  path: 'users/k4eD2Lq9xMo8',
  data: { name: 'Ada', age: 36, active: true },
  createTime: '2024-03-12T09:11:00Z',
  updateTime: '2026-05-22T18:42:00Z',
};

const baseProps = {
  document: doc,
  isLoading: false,
  onSave: vi.fn().mockResolvedValue(undefined),
  isSaving: false,
  onDuplicate: vi.fn(),
};

describe('DocumentPreviewSection', () => {
  beforeEach(() => {
    useViewStore.setState({ previewMode: 'json', listMode: 'list', theme: 'dark' });
    useDocDraftsStore.setState({ drafts: {} });
    vi.clearAllMocks();
  });

  it('renders the meta strip with field count', () => {
    render(<DocumentPreviewSection {...baseProps} />);
    expect(screen.getByText(/3 fields/i)).toBeInTheDocument();
  });

  it('shows a saved status when not dirty', () => {
    render(<DocumentPreviewSection {...baseProps} />);
    expect(screen.getByText(/saved/i)).toBeInTheDocument();
  });

  it('fires onDelete with the document path', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<DocumentPreviewSection {...baseProps} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('users/k4eD2Lq9xMo8');
  });

  it('does not show a save button when there are no changes', () => {
    render(<DocumentPreviewSection {...baseProps} />);
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });

  it('preserves unsaved edits across remount (tab switch)', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<DocumentPreviewSection {...baseProps} />);
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, '{{"name":"Bob"}');
    unmount();
    render(<DocumentPreviewSection {...baseProps} />);
    expect(screen.getByText(/unsaved/i)).toBeInTheDocument();
    expect((screen.getByTestId('monaco-editor') as HTMLTextAreaElement).value).toContain('Bob');
  });

  it('shows an unsaved status after editing', async () => {
    const user = userEvent.setup();
    render(<DocumentPreviewSection {...baseProps} />);
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, '{{"name":"Bob"}');
    expect(screen.getByText(/unsaved/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });
});
