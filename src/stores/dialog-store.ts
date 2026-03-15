import { create } from 'zustand';

export type DialogName =
  | 'createDocument'
  | 'duplicateCollection'
  | 'importCollection'
  | 'emulatorConnect'
  | 'saveQuery'
  | 'saveScript'
  | 'shortcutsHelp'
  | 'connectionManager'
  | 'transfer'
  | 'about';

type DialogStore = {
  stack: DialogName[];
  open: (name: DialogName) => void;
  close: (name: DialogName) => void;
  closeTop: () => void;
  isOpen: (name: DialogName) => boolean;
};

export const useDialogStore = create<DialogStore>()((set, get) => ({
  stack: [],
  open: (name) =>
    set((state) =>
      state.stack.includes(name) ? state : { stack: [...state.stack, name] },
    ),
  close: (name) =>
    set((state) => ({ stack: state.stack.filter((d) => d !== name) })),
  closeTop: () =>
    set((state) => ({ stack: state.stack.slice(0, -1) })),
  isOpen: (name) => get().stack.includes(name),
}));
