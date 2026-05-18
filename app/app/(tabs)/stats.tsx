import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius } from '../../lib/tokens';
import { useCurrentWeekStats, useHabitStreaks, usePastWeeks, HabitStreak, WeekRecord } from '../../lib/hooks/useStats';
import { Icon } from '../components/Icon';

// ─── Week range label ─────────────────────────────────────────────────────────

function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

// ─── Stats hero ───────────────────────────────────────────────────────────────

function StatsHero() {
  const { data, isLoading } = useCurrentWeekStats();
  const { data: streaks } = useHabitStreaks();

  const newBest = (streaks ?? []).find(
    (h) => h.current_streak > 0 && h.current_streak === h.best_streak,
  );

  if (isLoading) {
    return (
      <View style={[styles.hero, styles.heroLoading]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      <Text style={styles.heroLabel}>This week</Text>
      <View style={styles.fracsRow}>
        <View>
          <Text style={styles.frac}>
            {data?.tasks_done ?? 0}
            <Text style={styles.fracOf}>/{data?.tasks_total ?? 0}</Text>
          </Text>
          <Text style={styles.fracName}>tasks done</Text>
        </View>
        <View>
          <Text style={styles.frac}>
            {data?.habits_on_target ?? 0}
            <Text style={styles.fracOf}>/{data?.habits_total ?? 0}</Text>
          </Text>
          <Text style={styles.fracName}>habits on target</Text>
        </View>
      </View>
      {newBest ? (
        <View style={styles.newBest}>
          <Icon name="flame" size={16} color={colors.gold} />
          <Text style={styles.newBestText}>
            New best — {newBest.title} {newBest.best_streak} {newBest.best_streak === 1 ? 'week' : 'weeks'} running
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Habit streak row ─────────────────────────────────────────────────────────

function StreakRow({ habit }: { habit: HabitStreak }) {
  const isNewBest = habit.current_streak > 0 && habit.current_streak === habit.best_streak;
  return (
    <View style={styles.streakRow}>
      <Text style={styles.streakName}>{habit.title}</Text>
      <Text style={[styles.streakNow, isNewBest && styles.streakNowGold]}>
        {habit.current_streak} wk
      </Text>
      <Text style={styles.streakBest}>best {habit.best_streak}</Text>
    </View>
  );
}

// ─── Past week row ────────────────────────────────────────────────────────────

function WeekRow({ record }: { record: WeekRecord }) {
  return (
    <View style={styles.weekRow}>
      <Text style={styles.weekRange}>{weekRangeLabel(record.week_start_date)}</Text>
      <Text style={styles.weekFracs}>
        {record.tasks_completed_count}/{record.tasks_total_count} tasks · {record.habits_met_count}/{record.habits_total_count} habits
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Stats() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: streaks, isLoading: streaksLoading } = useHabitStreaks();
  const { data: pastWeeks, isLoading: pastLoading } = usePastWeeks();

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.pageHead}>
        <View>
          <Text style={styles.eyebrow}>Quiet progress</Text>
          <Text style={styles.h1}>Stats</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(settings)')}>
          <Icon name="settings" size={20} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <StatsHero />

        <Text style={styles.sectionLabel}>Habit streaks</Text>
        {streaksLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
        ) : (streaks ?? []).length === 0 ? (
          <Text style={styles.empty}>No active habits yet.</Text>
        ) : (
          (streaks ?? []).map((h) => <StreakRow key={h.id} habit={h} />)
        )}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Past weeks</Text>
        {pastLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
        ) : (pastWeeks ?? []).length === 0 ? (
          <Text style={styles.empty}>No past weeks yet — check back after the first Sunday rollover.</Text>
        ) : (
          (pastWeeks ?? []).map((w) => <WeekRow key={w.week_start_date} record={w} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  pageHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 4,
  },
  h1: {
    fontFamily: 'Georgia',
    fontSize: 30,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Stats hero
  hero: {
    padding: 22,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  heroLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 14,
  },
  fracsRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-end',
  },
  frac: {
    fontFamily: 'Georgia',
    fontSize: 36,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 36,
    letterSpacing: -0.7,
  },
  fracOf: {
    color: colors.text3,
  },
  fracName: {
    fontSize: 12,
    color: colors.text2,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  newBest: {
    marginTop: 18,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.goldDim,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newBestText: {
    color: colors.gold,
    fontSize: 13,
    flex: 1,
  },
  // Section label
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 10,
  },
  // Streak row
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  streakName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  streakNow: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  streakNowGold: {
    color: colors.gold,
  },
  streakBest: {
    fontSize: 11.5,
    color: colors.text3,
    letterSpacing: 0.3,
    minWidth: 60,
    textAlign: 'right',
  },
  // Week row
  weekRow: {
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekRange: {
    fontSize: 13,
    color: colors.text2,
  },
  weekFracs: {
    fontSize: 13.5,
    color: colors.text,
  },
  // Empty/loading
  empty: {
    fontSize: 13.5,
    color: colors.text3,
    lineHeight: 20,
    marginTop: 8,
  },
});
