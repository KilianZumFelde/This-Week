import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export type CurrentWeekStats = {
  tasks_done: number;
  tasks_total: number;
  habits_on_target: number;
  habits_total: number;
};

export type HabitStreak = {
  id: string;
  title: string;
  current_streak: number;
  best_streak: number;
};

export type WeekRecord = {
  week_start_date: string;
  tasks_completed_count: number;
  tasks_total_count: number;
  habits_met_count: number;
  habits_total_count: number;
};

export function useCurrentWeekStats() {
  return useQuery<CurrentWeekStats>({
    queryKey: ['stats', 'current-week'],
    queryFn: () => api.get<CurrentWeekStats>('/stats/current-week'),
  });
}

export function useHabitStreaks() {
  return useQuery<HabitStreak[]>({
    queryKey: ['stats', 'habit-streaks'],
    queryFn: () => api.get<HabitStreak[]>('/stats/habit-streaks'),
  });
}

export function usePastWeeks() {
  return useQuery<WeekRecord[]>({
    queryKey: ['stats', 'past-weeks'],
    queryFn: () => api.get<WeekRecord[]>('/stats/past-weeks'),
  });
}
