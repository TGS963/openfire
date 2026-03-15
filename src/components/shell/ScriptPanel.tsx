import Editor from '@monaco-editor/react';
import { Loader2, Play, Trash2, Save } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { createDbApi, executeScript } from '@/lib/script-engine';
import { useScriptStore } from '@/stores/script-store';
import { useViewStore } from '@/stores/view-store';

export type ScriptPanelProps = {
  onSaveRequest?: () => void;
};

export function ScriptPanel({ onSaveRequest }: ScriptPanelProps) {
  const script = useScriptStore((s) => s.script);
  const output = useScriptStore((s) => s.output);
  const isRunning = useScriptStore((s) => s.isRunning);
  const setScript = useScriptStore((s) => s.setScript);
  const addOutput = useScriptStore((s) => s.addOutput);
  const clearOutput = useScriptStore((s) => s.clearOutput);
  const setRunning = useScriptStore((s) => s.setRunning);
  const theme = useViewStore((s) => s.theme);

  const outputRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-white/[0.06] dark:bg-white/[0.01] bg-white/30 backdrop-blur-sm px-3 py-1.5">
        <span className="text-xs font-medium uppercase text-muted-foreground">Script Shell</span>
        <div className="flex items-center gap-1.5">
          {onSaveRequest && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onSaveRequest} aria-label="Save">
              <Save className="mr-1 h-3 w-3" />
              Save
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearOutput} aria-label="Clear">
            <Trash2 className="mr-1 h-3 w-3" />
            Clear
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleRun} disabled={isRunning} aria-label="Run">
            {isRunning ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Play className="mr-1 h-3 w-3" />
            )}
            Run
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
        <div className="flex w-[40%] min-w-[200px] flex-col border-l border-white/[0.06] dark:bg-white/[0.01] bg-white/20">
          <div className="border-b px-3 py-1 text-xs font-medium uppercase text-muted-foreground">
            Output
          </div>
          <div ref={outputRef} className="flex-1 overflow-auto p-3 font-mono text-xs">
            {output.map((line, i) => (
              <div
                key={i}
                className={
                  line.type === 'error'
                    ? 'text-red-400'
                    : line.type === 'result'
                      ? 'text-green-400'
                      : 'text-foreground'
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
