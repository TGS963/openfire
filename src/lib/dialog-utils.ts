import { open as openDialogPlugin } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

type OpenDialogOptions = {
  filters?: { name: string; extensions: string[] }[];
  multiple?: boolean;
};

export async function openFileDialog(options: OpenDialogOptions): Promise<string | null> {
  let file: string | string[] | null = null;

  try {
    file = await openDialogPlugin(options);
  } catch {
    try {
      file = await invoke<string | string[] | null>('plugin:dialog|open', {
        options,
        windowLabel: 'main',
      });
    } catch {
      return null;
    }
  }

  if (Array.isArray(file)) {
    file = file[0] ?? null;
  }

  return typeof file === 'string' ? file : null;
}
