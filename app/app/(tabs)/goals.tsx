import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { colors, radius } from '../../lib/tokens';
import { useGoals, useGoalStats, Goal } from '../../lib/hooks/useGoals';
import { useThemes } from '../../lib/hooks/useThemes';
import { Icon } from '../components/Icon';
import { GoalActionDrawer } from '../components/GoalActionDrawer';
import { SkeletonCard, ScreenError } from '../components/Skeleton';

// ─── Months remaining helper ─────────────────────────────────────────────────

function monthsLeft(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate + 'T00:00:00');
  const months = (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth();
  return Math.max(0, months);
}

// ─── Goal card ───────────────────────────────────────────────────────────────

function PrimaryGoalCard({
  goal,
  themeColor,
  themeName,
  onPress,
}: {
  goal: Goal;
  themeColor: string | null;
  themeName: string | null;
  onPress: () => void;
}) {
  const { data: stats } = useGoalStats(goal.id);
  const mo = monthsLeft(goal.target_date);

  const eyebrow = [themeName, `by ${new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity style={styles.goalPrimary} onPress={onPress} activeOpacity={0.85}>
      <Text style={[styles.goalEyebrow, { color: colors.accentStrong }]}>{eyebrow}</Text>
      <Text style={styles.goalTitle}>{goal.title}</Text>
      {goal.why ? (
        <Text style={styles.goalWhy}>"{goal.why}"</Text>
      ) : null}
      <View style={styles.goalStats}>
        <Text style={styles.goalStatText}>
          <Text style={styles.goalStatN}>{stats?.tasks_this_week ?? 0}</Text> tasks this week
        </Text>
        <Text style={styles.goalStatText}>
          <Text style={styles.goalStatN}>{stats?.habits_linked ?? 0}</Text> habits linked
        </Text>
        {mo > 0 && (
          <Text style={[styles.goalTimeLeft, { color: colors.accentStrong }]}>
            {mo} mo left
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function SecondaryGoalCard({
  goal,
  themeColor,
  themeName,
  onPress,
}: {
  goal: Goal;
  themeColor: string | null;
  themeName: string | null;
  onPress: () => void;
}) {
  const { data: stats } = useGoalStats(goal.id);
  const mo = monthsLeft(goal.target_date);

  const eyebrow = [themeName, `by ${new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity style={[styles.goalCard, { marginBottom: 10 }]} onPress={onPress} activeOpacity={0.85}>
      <Text style={[styles.goalEyebrow, { color: colors.slate }]}>{eyebrow}</Text>
      <Text style={styles.goalTitle}>{goal.title}</Text>
      <View style={styles.goalStats}>
        <Text style={styles.goalStatText}>
          <Text style={styles.goalStatN}>{stats?.tasks_this_week ?? 0}</Text> tasks this week
        </Text>
        <Text style={styles.goalStatText}>
          <Text style={styles.goalStatN}>{stats?.habits_linked ?? 0}</Text> habits linked
        </Text>
        {mo > 0 && (
          <Text style={[styles.goalTimeLeft, { color: colors.text3 }]}>
            {mo} mo left
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function Goals() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [graveOpen, setGraveOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const { data: goals, isLoading, isError, refetch } = useGoals();
  const { data: themes } = useThemes();

  const themeMap = Object.fromEntries((themes ?? []).map((t) => [t.id, t]));

  const activeGoals = (goals ?? []).filter((g) => g.status === 'active');
  const primaryGoals = activeGoals.filter((g) => g.goal_type === 'primary');
  const secondaryGoals = activeGoals.filter((g) => g.goal_type === 'secondary');
  const pastGoals = (goals ?? []).filter((g) => g.status !== 'active');

  function openGoal(goal: Goal) {
    setSelectedGoal(goal);
  }

  function handleEdit(goal: Goal) {
    router.push({ pathname: '/add-goal', params: { goalId: goal.id } });
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Page header */}
      <View style={styles.pageHead}>
        <View>
          <Text style={styles.eyebrow}>What you're working toward</Text>
          <Text style={styles.h1}>Goals</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(settings)')}>
          <Icon name="settings" size={20} color={colors.text2} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 140 }}>
          <SkeletonCard height={160} />
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </ScrollView>
      ) : isError ? (
        <ScreenError onRetry={refetch} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.accent} />
          }
        >
          {/* Primary section */}
          <View style={[styles.sectionLabel, { marginTop: 0 }]}>
            <Text style={styles.sectionLabelText}>Primary</Text>
            <Text style={styles.sectionLabelCount}>{primaryGoals.length} of 1</Text>
          </View>
          {primaryGoals.length > 0 ? (
            primaryGoals.map((g) => (
              <PrimaryGoalCard
                key={g.id}
                goal={g}
                themeColor={themeMap[g.theme_id ?? '']?.color ?? null}
                themeName={themeMap[g.theme_id ?? '']?.name ?? null}
                onPress={() => openGoal(g)}
              />
            ))
          ) : (
            <Text style={styles.emptySlot}>No primary goal yet — add one below.</Text>
          )}

          {/* Secondary section */}
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>Secondary</Text>
            <Text style={styles.sectionLabelCount}>{secondaryGoals.length} of 2 slots</Text>
          </View>
          {secondaryGoals.length > 0 ? (
            secondaryGoals.map((g) => (
              <SecondaryGoalCard
                key={g.id}
                goal={g}
                themeColor={themeMap[g.theme_id ?? '']?.color ?? null}
                themeName={themeMap[g.theme_id ?? '']?.name ?? null}
                onPress={() => openGoal(g)}
              />
            ))
          ) : (
            <Text style={styles.emptySlot}>No secondary goals yet.</Text>
          )}

          {/* Button row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={() => router.push('/add-goal')}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={16} color={colors.text} />
              <Text style={styles.btnGhostText}>Add directly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { flex: 1.3 }]}
              activeOpacity={0.7}
            >
              <Icon name="sparkles" size={16} color="#1a1816" />
              <Text style={styles.btnPrimaryText}>Coach me</Text>
            </TouchableOpacity>
          </View>

          {/* Graveyard */}
          {pastGoals.length > 0 && (
            <>
              <TouchableOpacity
                style={[styles.doneBar, { marginTop: 30 }]}
                onPress={() => setGraveOpen((o) => !o)}
                activeOpacity={0.7}
              >
                <View style={styles.doneBarLabel}>
                  <Icon name={graveOpen ? 'chevron-down' : 'chevron-right'} size={14} color={colors.text2} />
                  <Text style={styles.doneBarText}>Past goals ({pastGoals.length})</Text>
                </View>
              </TouchableOpacity>
              {graveOpen && (
                <View style={{ paddingTop: 6 }}>
                  {pastGoals.map((g) => {
                    const resLabel =
                      g.status === 'completed' ? 'Hit' : g.status === 'archived' ? 'Abandoned' : 'Missed';
                    const resColor =
                      g.status === 'completed' ? colors.sage : g.status === 'archived' ? colors.text3 : colors.brick;
                    const dateStr = new Date(
                      (g.completed_at ?? g.archived_at ?? g.updated_at)
                    ).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={styles.graveRow}
                        onPress={() => openGoal(g)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.graveRes, { color: resColor }]}>{resLabel}</Text>
                        <Text style={styles.graveName}>{g.title}</Text>
                        <Text style={styles.graveDate}>{dateStr}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <GoalActionDrawer
        goal={selectedGoal}
        themes={themes ?? []}
        onClose={() => setSelectedGoal(null)}
        onEdit={handleEdit}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  pageHead: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
    fontWeight: '500',
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.6,
    color: colors.text,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionLabelText: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '500',
  },
  sectionLabelCount: {
    fontSize: 11,
    color: colors.text3,
  },
  emptySlot: {
    fontSize: 13,
    color: colors.text3,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  // Primary goal card — with radial gradient background approximation
  goalPrimary: {
    borderRadius: radius.lg,
    padding: 18,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
    overflow: 'hidden',
    // React Native can't do CSS gradients; we approximate with surface color
    // The gradient effect is provided by the eyebrow/accent color contrast
  },
  goalCard: {
    borderRadius: radius.lg,
    padding: 18,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  goalEyebrow: {
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
  },
  goalTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: -0.2,
    color: colors.text,
    marginBottom: 12,
  },
  goalWhy: {
    fontSize: 13.5,
    color: colors.text2,
    lineHeight: 20,
    marginBottom: 12,
  },
  goalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalStatText: {
    fontSize: 12.5,
    color: colors.text2,
  },
  goalStatN: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  goalTimeLeft: {
    marginLeft: 'auto',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.md,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.hairline2,
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1816',
  },
  // Done bar / graveyard
  doneBar: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  doneBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneBarText: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text2,
    fontWeight: '500',
  },
  graveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  graveRes: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
    minWidth: 66,
  },
  graveName: {
    flex: 1,
    fontSize: 14,
    color: colors.text2,
  },
  graveDate: {
    fontSize: 12,
    color: colors.text3,
  },
});
