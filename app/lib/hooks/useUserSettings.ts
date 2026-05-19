import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

export type UserSettings = {
  user_id: string;
  timezone: string;
  danger_zone_nudges_enabled: boolean;
  theme_mode: 'dark' | 'light' | 'system';
};

export function useUserSettings() {
  return useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: () => api.get<UserSettings>('/user-settings'),
  });
}

export const THEME_MODE_KEY = 'theme_mode';

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Pick<UserSettings, 'danger_zone_nudges_enabled' | 'theme_mode' | 'timezone'>>) => {
      if (updates.theme_mode) {
        await AsyncStorage.setItem(THEME_MODE_KEY, updates.theme_mode);
      }
      return api.patch<UserSettings>('/user-settings', updates);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-settings'], data);
    },
  });
}
