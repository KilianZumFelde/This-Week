import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SessionProvider, useSession } from '../lib/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UndoSnackbar } from './components/UndoSnackbar';
import { api } from '../lib/api';
import { useRolloverStore } from '../lib/stores/rollover-store';

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const segments = useSegments();
  const router = useRouter();
  const { pendingRitualId, setPendingRitualId } = useRolloverStore();
  const rolloverChecked = useRef(false);

  useEffect(() => {
    if (session === undefined) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
      rolloverChecked.current = false;
      return;
    }
    if (session && inAuthGroup) {
      router.replace('/(tabs)');
      return;
    }
  }, [session, segments]);

  // After sign-in, check for pending rollover ritual once per session
  useEffect(() => {
    if (!session || rolloverChecked.current) return;
    rolloverChecked.current = true;

    api.post<{ rolled_over: boolean; pending_ritual_id: string | null }>('/rollover/check')
      .then((res) => {
        if (res.pending_ritual_id) {
          setPendingRitualId(res.pending_ritual_id);
          router.replace('/carry-recap');
        }
      })
      .catch(() => {
        // Non-fatal: app continues normally if rollover check fails
      });
  }, [session]);

  // If ritual becomes pending mid-session, block tabs
  useEffect(() => {
    if (!pendingRitualId) return;
    const inRitual =
      segments.includes('carry-recap') ||
      segments.includes('carry-triage') ||
      segments.includes('carry-pull') ||
      segments.includes('new-week');
    if (!inRitual) {
      router.replace('/carry-recap');
    }
  }, [pendingRitualId]);

  if (session === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-[#1a1816]">
        <ActivityIndicator color="#c87856" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="quick-add" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-goal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="carry-recap" options={{ headerShown: false }} />
            <Stack.Screen name="carry-triage" options={{ headerShown: false }} />
            <Stack.Screen name="carry-pull" options={{ headerShown: false }} />
            <Stack.Screen name="new-week" options={{ headerShown: false }} />
          </Stack>
          <UndoSnackbar />
        </AuthGuard>
      </SessionProvider>
    </QueryClientProvider>
  );
}
