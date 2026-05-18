import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { getCurrentWeekStartDate } from '../week';

export type Habit = {
  id: string;
  user_id: string;
  theme_id: string;
  goal_id: string | null;
  title: string;
  notes: string | null;
  status: 'active' | 'paused' | 'archived';
  weekly_target: number;
  current_streak: number;
  best_streak: number;
  danger_zone_nudge_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type HabitWeekRecord = {
  id: string;
  habit_id: string;
  week_start_date: string;
  target_count: number;
  completed_count: number;
  target_met: boolean;
};

export function useHabits() {
  return useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: () => api.get<Habit[]>('/habits'),
  });
}

export function useHabitWeekRecords() {
  const weekStart = getCurrentWeekStartDate();
  return useQuery<HabitWeekRecord[]>({
    queryKey: ['habit_week_records', weekStart],
    queryFn: () =>
      api.get<HabitWeekRecord[]>(
        `/habits/week-records?week_start_date=${weekStart}`,
      ),
  });
}

export function useIncrementHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) =>
      api.post<HabitWeekRecord>(`/habits/${habitId}/increment`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habit_week_records'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      theme_id: string;
      title: string;
      weekly_target: number;
      goal_id?: string | null;
    }) => api.post<Habit>('/habits', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Habit> & { id: string }) =>
      api.patch<Habit>(`/habits/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/habits/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
