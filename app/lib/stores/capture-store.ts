import { create } from 'zustand';

export type CaptureItem = {
  item_type: 'task' | 'habit';
  title: string;
  theme_id: string | null;
  effort_level?: 'low' | 'medium' | 'high' | null;
  return_level?: 'low' | 'medium' | 'high' | null;
  week_assignment?: 'this_week' | 'backlog' | null;
  weekly_target?: number | null;
  goal_id?: string | null;
  reminder_spec?: {
    kind: 'one_shot' | 'recurring_until_done';
    scheduled_for: string | null;
    recurrence_rule: string | null;
  } | null;
  confidence_flags: string[];
};

type CaptureStore = {
  transcript: string;
  drafts: CaptureItem[];
  currentIndex: number;
  setCapture: (transcript: string, drafts: CaptureItem[]) => void;
  advanceIndex: () => void;
  clearCapture: () => void;
};

export const useCaptureStore = create<CaptureStore>((set) => ({
  transcript: '',
  drafts: [],
  currentIndex: 0,
  setCapture: (transcript, drafts) => set({ transcript, drafts, currentIndex: 0 }),
  advanceIndex: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),
  clearCapture: () => set({ transcript: '', drafts: [], currentIndex: 0 }),
}));
