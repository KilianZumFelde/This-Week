import { create } from 'zustand';

type RolloverState = {
  pendingRitualId: string | null;
  setPendingRitualId: (id: string | null) => void;
  goalIndex: number;
  setGoalIndex: (i: number) => void;
  resetGoalStep: () => void;
};

export const useRolloverStore = create<RolloverState>((set) => ({
  pendingRitualId: null,
  setPendingRitualId: (id) => set({ pendingRitualId: id }),
  goalIndex: 0,
  setGoalIndex: (i) => set({ goalIndex: i }),
  resetGoalStep: () => set({ goalIndex: 0 }),
}));
