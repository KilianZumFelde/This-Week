import { create } from 'zustand';

type RolloverState = {
  pendingRitualId: string | null;
  setPendingRitualId: (id: string | null) => void;
};

export const useRolloverStore = create<RolloverState>((set) => ({
  pendingRitualId: null,
  setPendingRitualId: (id) => set({ pendingRitualId: id }),
}));
