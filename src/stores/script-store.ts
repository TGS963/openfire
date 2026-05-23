import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OutputLine = {
  id: string;
  type: 'log' | 'error' | 'result';
  content: string;
  timestamp: number;
};
export type SavedScript = { id: string; name: string; script: string };

type ScriptStore = {
  script: string;
  output: OutputLine[];
  savedScripts: SavedScript[];
  isRunning: boolean;
  setScript: (s: string) => void;
  addOutput: (line: Omit<OutputLine, 'id'>) => void;
  clearOutput: () => void;
  setRunning: (r: boolean) => void;
  saveScript: (name: string, script: string) => void;
  deleteScript: (id: string) => void;
};

export const useScriptStore = create<ScriptStore>()(
  persist(
    (set) => ({
      script: '',
      output: [],
      savedScripts: [],
      isRunning: false,
      setScript: (script) => set({ script }),
      addOutput: (line) =>
        set((state) => ({
          output: [...state.output, { id: crypto.randomUUID(), ...line }],
        })),
      clearOutput: () => set({ output: [] }),
      setRunning: (isRunning) => set({ isRunning }),
      saveScript(name, script) {
        const entry: SavedScript = { id: crypto.randomUUID(), name, script };
        set((state) => ({ savedScripts: [...state.savedScripts, entry] }));
      },
      deleteScript(id) {
        set((state) => ({ savedScripts: state.savedScripts.filter((s) => s.id !== id) }));
      },
    }),
    {
      name: 'script-store',
      partialize: (state) => ({ savedScripts: state.savedScripts }),
    },
  ),
);
