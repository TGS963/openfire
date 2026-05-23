import Editor from '@monaco-editor/react';
import { Loader2, Play, Trash2, Save } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { createDbApi, executeScript } from '@/lib/script-engine';
import { useScriptStore } from '@/stores/script-store';
import { useViewStore } from '@/stores/view-store';

export type ScriptPanelProps = {
  onSaveRequest?: () => void;
  runRef?: React.MutableRefObject<(() => void) | null>;
};

export function ScriptPanel({ onSaveRequest, runRef }: ScriptPanelProps) {
  const script = useScriptStore((s) => s.script);
  const output = useScriptStore((s) => s.output);
  const isRunning = useScriptStore((s) => s.isRunning);
  const setScript = useScriptStore((s) => s.setScript);
  const addOutput = useScriptStore((s) => s.addOutput);
  const clearOutput = useScriptStore((s) => s.clearOutput);
  const setRunning = useScriptStore((s) => s.setRunning);
  const theme = useViewStore((s) => s.theme);

  const outputRef = useRef<HTMLDivElement>(null);
  const handleRunRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleRun = async () => {
    if (isRunning || !script.trim()) return;
    setRunning(true);
    try {
      const db = createDbApi();
      const result = await executeScript(script, db, (type, content) => {
        addOutput({ type, content, timestamp: Date.now() });
      });
      if (result !== undefined) {
        const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        addOutput({ type: 'result', content, timestamp: Date.now() });
      }
    } catch (err) {
      addOutput({
        type: 'error',
        content: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      });
    } finally {
      setRunning(false);
    }
  };

  handleRunRef.current = handleRun;

  useEffect(() => {
    if (!runRef) return;
    runRef.current = () => handleRunRef.current();
    return () => {
      runRef.current = null;
    };
  }, [runRef]);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-8 items-center gap-2 border-b border-border-soft bg-surface-1 px-2.5 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
        <span>shell</span>
        <span className="h-3 w-px bg-border-soft" />
        <span className="normal-case text-text-faint">script</span>
        <div className="ml-auto flex items-center gap-0.5">
          {onSaveRequest && (
            <Button variant="ghost" size="icon" onClick={onSaveRequest} aria-label="Save script">
              <Save className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={clearOutput} aria-label="Clear output">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={handleRun} disabled={isRunning} aria-label="Run" className="ml-1 gap-1.5">
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Play className="h-3 w-3" />
                Run
                <Kbd className="border-[var(--kbd-tip-border)] bg-[var(--kbd-tip-bg)] text-ember-fg">⌘⏎</Kbd>
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          <Editor
            defaultLanguage="javascript"
            value={script}
            onChange={(v) => setScript(v ?? '')}
            theme={theme === 'dark' ? 'vs-dark' : 'vs'}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
            }}
          />
        </div>
        <div className="flex w-[36%] min-w-[200px] flex-col border-l border-border-soft bg-surface-1">
          <div className="border-b border-border-soft px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
            Output
          </div>
          <div ref={outputRef} className="flex-1 overflow-auto p-3 font-mono text-[12px]">
            {output.map((line) => (
              <div
                key={line.id}
                className={
                  line.type === 'error'
                    ? 'text-danger'
                    : line.type === 'result'
                      ? 'text-success'
                      : 'text-text-mid'
                }
              >
                {line.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
