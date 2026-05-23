import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useScriptStore } from '@/stores/script-store';

// Mock Monaco editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="monaco-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

// Mock script engine
vi.mock('@/lib/script-engine', () => ({
  createDbApi: vi.fn(() => ({})),
  executeScript: vi.fn(),
}));

// Import after mocks
import { ScriptPanel } from '@/components/shell/ScriptPanel';
import { executeScript } from '@/lib/script-engine';

describe('ScriptPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useScriptStore.setState({
      script: '',
      output: [],
      savedScripts: [],
      isRunning: false,
    });
  });

  it('renders editor and output panel', () => {
    render(<ScriptPanel />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
  });

  it('renders Run button', () => {
    render(<ScriptPanel />);
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
  });

  it('renders Clear button', () => {
    render(<ScriptPanel />);
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('calls executeScript on Run click', async () => {
    const user = userEvent.setup();
    vi.mocked(executeScript).mockResolvedValueOnce(42);
    useScriptStore.setState({ script: '1 + 1' });
    render(<ScriptPanel />);
    await user.click(screen.getByRole('button', { name: /run/i }));
    expect(executeScript).toHaveBeenCalled();
  });

  it('clears output on Clear click', async () => {
    const user = userEvent.setup();
    useScriptStore.setState({
      output: [{ id: '1', type: 'log', content: 'hello', timestamp: 1 }],
    });
    render(<ScriptPanel />);
    expect(screen.getByText('hello')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });

  it('renders output lines with correct styling', () => {
    useScriptStore.setState({
      output: [
        { id: '1', type: 'log', content: 'info message', timestamp: 1 },
        { id: '2', type: 'error', content: 'error message', timestamp: 2 },
        { id: '3', type: 'result', content: '42', timestamp: 3 },
      ],
    });
    render(<ScriptPanel />);
    expect(screen.getByText('info message')).toBeInTheDocument();
    expect(screen.getByText('error message')).toHaveClass('text-red-400');
    expect(screen.getByText('42')).toHaveClass('text-green-400');
  });

  it('shows save button and triggers dialog', async () => {
    const onSave = vi.fn();
    render(<ScriptPanel onSaveRequest={onSave} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalled();
  });
});
