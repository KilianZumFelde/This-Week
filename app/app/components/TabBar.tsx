import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/tokens';
import { Icon } from './Icon';

const TABS = [
  { name: 'index', label: 'This Week', icon: 'home' },
  { name: 'backlog', label: 'Backlog', icon: 'inbox' },
  { name: 'goals', label: 'Goals', icon: 'target' },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const bottomOffset = Math.max(14, insets.bottom);

  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      {/* Single FAB — tap for quick-add, hold for voice */}
      <View style={styles.fabPair} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fabLarge}
          activeOpacity={0.85}
          onPress={() => {
            const activeTab = TABS[state.index]?.name;
            const defaultWeek = activeTab === 'backlog' ? 'backlog' : 'this_week';
            router.push(`/quick-add?defaultWeek=${defaultWeek}`);
          }}
          onLongPress={() => {
            Vibration.vibrate(40);
            router.push('/voice-listening');
          }}
          delayLongPress={300}
        >
          <Icon name="plus" size={24} color="#1a1816" />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabbar}>
        {TABS.map((tab, index) => {
          const isActive = state.index === index;
          const color = isActive ? colors.accentStrong : colors.text3;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
            >
              <Icon name={tab.icon} size={21} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 160,
  },
  tabbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    height: 64,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(37, 33, 30, 0.92)',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 245, 232, 0.10)',
  },
  tabButton: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.15,
    fontWeight: '500',
  },
  fabPair: {
    position: 'absolute',
    right: 22,
    bottom: 78,
    alignItems: 'center',
    gap: 10,
  },
  fabLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c87856',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 10,
  },
});
