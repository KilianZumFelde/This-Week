import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export type HealthLevelValue = 'behind' | 'slightly_behind' | 'on_track' | 'ahead' | 'well_ahead';
export type ProgressAnswer = 'a_lot' | 'some' | 'barely' | 'nothing';
export type ConfidenceAnswer = 'yes' | 'maybe' | 'no';

export type Goal = {
  id: string;
  user_id: string;
  theme_id: string | null;
  title: string;
  why: string | null;
  goal_type: 'primary' | 'secondary';
  status: 'active' | 'completed' | 'archived';
  target_date: string;
  completed_at: string | null;
  archived_at: string | null;
  sort_order: number;
  // Release 1: health columns (nullable until first Sunday triage)
  health_level: HealthLevelValue | null;
  progress_answer: ProgressAnswer | null;
  confidence_answer: ConfidenceAnswer | null;
  health_set_date: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalStats = {
  tasks_this_week: number;
  tasks_completed_this_week: number;
  habits_linked: number;
};

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => api.get<Goal[]>('/goals'),
  });
}

export function useGoalStats(goalId: string | null) {
  return useQuery<GoalStats>({
    queryKey: ['goals', goalId, 'stats'],
    queryFn: () => api.get<GoalStats>(`/goals/${goalId}/stats`),
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title: string;
      goal_type: 'primary' | 'secondary';
      target_date: string;
      theme_id?: string | null;
      why?: string | null;
    }) => api.post<Goal>('/goals', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Goal> & { id: string }) =>
      api.patch<Goal>(`/goals/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useMarkGoalHit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Goal>(`/goals/${id}/mark-hit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useAbandonGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Goal>(`/goals/${id}/abandon`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
