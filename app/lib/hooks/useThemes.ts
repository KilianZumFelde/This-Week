import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export type Theme = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_archived: boolean;
};

export function useThemes() {
  return useQuery<Theme[]>({
    queryKey: ['themes'],
    queryFn: () => api.get<Theme[]>('/themes'),
  });
}
