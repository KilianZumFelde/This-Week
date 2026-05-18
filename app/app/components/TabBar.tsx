import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/tokens';
import { Icon } from './Icon';

const TABS = [
  { name: 'index', label: 'This Week', icon: 'home' },
  { name: 'backlog', label: 'Backlog', icon: 'inbox' },
  { name: 'goals', label: 'Goals', icon: 'target' },
  { name: 'stats', label: 'Stats', icon: 'bar-chart' },
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
      {/* FAB pair — sits above the tab bar */}
      <View style={styles.fabPair} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fabSmall}
          onPress={() => {
            const activeTab = TABS[state.index]?.name;
            const defaultWeek = activeTab === 'backlog' ? 'backlog' : 'this_week';
            router.push(`/quick-add?defaultWeek=${defaultWeek}`);
          }}
          activeOpacity={0.85}
        >
          <Icon name="plus" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fabLarge}
          activeOpacity={0.85}
          onPress={() => router.push('/voice-listening')}
        >
          <Icon name="mic" size={22} color="#1a1816" />
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
  fabSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 9,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 232, 0.10)',
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
