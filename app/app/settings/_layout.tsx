import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="themes" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}
