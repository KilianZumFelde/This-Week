import { Tabs } from 'expo-router';
import { TabBar } from '../components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'This Week' }} />
      <Tabs.Screen name="backlog" options={{ title: 'Backlog' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
    </Tabs>
  );
}
