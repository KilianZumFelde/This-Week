import { create } from 'zustand';

type UndoAction = {
  label: string;
  undo: () => void;
};

type UndoState = {
  action: UndoAction | null;
  timerId: ReturnType<typeof setTimeout> | null;
  show: (action: UndoAction) => void;
  dismiss: () => void;
  execute: () => void;
};

export const useUndoStore = create<UndoState>((set, get) => ({
  action: null,
  timerId: null,

  show: (action) => {
    const prev = get().timerId;
    if (prev) clearTimeout(prev);
    const timerId = setTimeout(() => {
      set({ action: null, timerId: null });
    }, 6000);
    set({ action, timerId });
  },

  dismiss: () => {
    const prev = get().timerId;
    if (prev) clearTimeout(prev);
    set({ action: null, timerId: null });
  },

  execute: () => {
    const { action, timerId } = get();
    if (timerId) clearTimeout(timerId);
    action?.undo();
    set({ action: null, timerId: null });
  },
}));
