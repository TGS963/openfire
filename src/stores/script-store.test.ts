import { describe, it, expect, beforeEach } from 'vitest';

import { useScriptStore } from '@/stores/script-store';

describe('script-store', () => {
  beforeEach(() => {
    useScriptStore.setState({
      script: '',
      output: [],
      savedScripts: [],
      isRunning: false,
    });
  });

  it('defaults to empty state', () => {
    const state = useScriptStore.getState();
    expect(state.script).toBe('');
    expect(state.output).toEqual([]);
    expect(state.savedScripts).toEqual([]);
    expect(state.isRunning).toBe(false);
  });

  it('sets script content', () => {
    useScriptStore.getState().setScript('console.log("hello")');
    expect(useScriptStore.getState().script).toBe('console.log("hello")');
  });

  it('adds output lines', () => {
    const line = { type: 'log' as const, content: 'hello', timestamp: 1000 };
    useScriptStore.getState().addOutput(line);
    expect(useScriptStore.getState().output).toEqual([line]);
  });

  it('appends multiple output lines', () => {
    useScriptStore.getState().addOutput({ type: 'log', content: 'a', timestamp: 1 });
    useScriptStore.getState().addOutput({ type: 'error', content: 'b', timestamp: 2 });
    expect(useScriptStore.getState().output).toHaveLength(2);
    expect(useScriptStore.getState().output[1].type).toBe('error');
  });

  it('clears output', () => {
    useScriptStore.getState().addOutput({ type: 'log', content: 'a', timestamp: 1 });
    useScriptStore.getState().clearOutput();
    expect(useScriptStore.getState().output).toEqual([]);
  });

  it('sets running state', () => {
    useScriptStore.getState().setRunning(true);
    expect(useScriptStore.getState().isRunning).toBe(true);
    useScriptStore.getState().setRunning(false);
    expect(useScriptStore.getState().isRunning).toBe(false);
  });

  it('saves a script', () => {
    useScriptStore.getState().saveScript('My Script', 'db.collection("users").get()');
    const saved = useScriptStore.getState().savedScripts;
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('My Script');
    expect(saved[0].script).toBe('db.collection("users").get()');
    expect(saved[0].id).toBeTruthy();
  });

  it('deletes a script', () => {
    useScriptStore.getState().saveScript('Script 1', 'code1');
    useScriptStore.getState().saveScript('Script 2', 'code2');
    const id = useScriptStore.getState().savedScripts[0].id;
    useScriptStore.getState().deleteScript(id);
    expect(useScriptStore.getState().savedScripts).toHaveLength(1);
    expect(useScriptStore.getState().savedScripts[0].name).toBe('Script 2');
  });
});
