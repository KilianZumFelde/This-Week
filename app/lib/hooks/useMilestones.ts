import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export type Milestone = {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  target_date: string;
  status: 'active' | 'hit';
  hit_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useMilestones(goalId: string | null) {
  return useQuery<Milestone[]>({
    queryKey: ['milestones', goalId],
    queryFn: () => api.get<Milestone[]>(`/goals/${goalId}/milestones`),
    enabled: !!goalId,
  });
}

export function useCreateMilestone(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; target_date: string }) =>
      api.post<Milestone>(`/goals/${goalId}/milestones`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', goalId] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateMilestone(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; target_date?: string }) =>
      api.patch<Milestone>(`/milestones/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', goalId] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useMarkMilestoneHit(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Milestone>(`/milestones/${id}/mark-hit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', goalId] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteMilestone(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/milestones/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', goalId] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
