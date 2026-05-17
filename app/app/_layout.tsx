import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SessionProvider, useSession } from '../lib/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UndoSnackbar } from './components/UndoSnackbar';

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (session === undefined) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments]);

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
          </Stack>
          <UndoSnackbar />
        </AuthGuard>
      </SessionProvider>
    </QueryClientProvider>
  );
}
