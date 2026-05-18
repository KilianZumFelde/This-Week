import { create } from 'zustand';

type ReminderInputContext = 'task-detail' | 'quick-add';

type ReminderInputStore = {
  pendingTranscript: string | null;
  sourceContext: ReminderInputContext | null;
  set: (transcript: string, ctx: ReminderInputContext) => void;
  clear: () => void;
};

export const useReminderInputStore = create<ReminderInputStore>((set) => ({
  pendingTranscript: null,
  sourceContext: null,
  set: (transcript, ctx) => set({ pendingTranscript: transcript, sourceContext: ctx }),
  clear: () => set({ pendingTranscript: null, sourceContext: null }),
}));
