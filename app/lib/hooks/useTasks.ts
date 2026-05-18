import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { getCurrentWeekStartDate } from '../week';

export type Task = {
  id: string;
  user_id: string;
  theme_id: string;
  goal_id: string | null;
  title: string;
  notes: string | null;
  status: 'open' | 'done' | 'archived_done';
  week_assignment: 'this_week' | 'backlog';
  week_start_date: string | null;
  effort_level: 'low' | 'medium' | 'high' | 'unknown';
  return_level: 'low' | 'medium' | 'high' | 'unknown';
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function useThisWeekTasks() {
  const weekStart = getCurrentWeekStartDate();
  return useQuery<Task[]>({
    queryKey: ['tasks', 'this_week', weekStart],
    queryFn: () =>
      api.get<Task[]>(`/tasks?week_assignment=this_week&week_start_date=${weekStart}`),
  });
}

export function useBacklogTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'backlog'],
    queryFn: () => api.get<Task[]>('/tasks?week_assignment=backlog&status=open'),
  });
}

export function usePromoteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.post<Task>(`/tasks/${taskId}/promote`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.post<Task>(`/tasks/${taskId}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useReopenTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.post<Task>(`/tasks/${taskId}/reopen`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      theme_id: string;
      title: string;
      effort_level?: string;
      return_level?: string;
      goal_id?: string | null;
      week_assignment?: 'this_week' | 'backlog';
    }) => api.post<Task>('/tasks', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Task> & { id: string }) =>
      api.patch<Task>(`/tasks/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
