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
import { useGoals, useNearestMilestones } from '../../lib/hooks/useGoals';
import type { Goal, NearestMilestone } from '../../lib/hooks/useGoals';
import { useThemes } from '../../lib/hooks/useThemes';
import { Track, healthByKey } from '../components/HealthTrack';
import { Icon } from '../components/Icon';
import { SkeletonCard, ScreenError } from '../components/Skeleton';

// ─── Months remaining helper ─────────────────────────────────────────────────

function monthsLeft(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate + 'T00:00:00');
  const months = (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth();
  return Math.max(0, months);
}

// ─── Nearest-milestone line ───────────────────────────────────────────────────

function MilestoneLine({ ms }: { ms: NearestMilestone | undefined | null }) {
  if (!ms) {
    return (
      <Text style={msStyles.noMs}>+ Add milestone to track progress</Text>
    );
  }
  const dateStr = new Date(ms.target_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return (
    <View style={msStyles.row}>
      <Icon
        name={ms.is_overdue ? 'bell' : 'target'}
        size={13}
        color={ms.is_overdue ? colors.brick : colors.text3}
      />
      <Text style={[msStyles.text, ms.is_overdue && { color: colors.brick }]} numberOfLines={1}>
        <Text style={msStyles.label}>Next: </Text>
        {ms.title} · by {dateStr}
      </Text>
    </View>
  );
}

const msStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  text: { fontSize: 12.5, color: colors.text2, flex: 1 },
  label: { color: colors.text3 },
  noMs: { fontSize: 12.5, color: colors.text3, fontStyle: 'italic', marginBottom: 12 },
});

// ─── Goal card ───────────────────────────────────────────────────────────────

export function GoalCardBody({
  goal,
  themeColor,
  themeName,
  nearestMs,
  isPrimary,
}: {
  goal: Goal;
  themeColor: string | null;
  themeName: string | null;
  nearestMs: NearestMilestone | undefined | null;
  isPrimary: boolean;
}) {
  const mo = monthsLeft(goal.target_date);
  const eyebrowColor = isPrimary ? colors.accentStrong : (themeColor ?? colors.slate);

  const eyebrow = [
    themeName,
    `by ${new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const health = goal.health_level ? healthByKey(goal.health_level) : null;

  return (
    <>
      <Text style={[styles.goalEyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
      <Text style={[styles.goalTitle, { fontSize: isPrimary ? 20 : 18 }]}>{goal.title}</Text>

      {/* Health track (large, labeled) */}
      <View style={styles.healthRow}>
        <View style={styles.healthHeader}>
          <Text style={styles.healthLabel}>Goal health</Text>
          {health && (
            <Text style={[styles.healthLevel, { color: health.color }]}>{health.label}</Text>
          )}
        </View>
        {health ? (
          <Track pos={health.pos} size="lg" />
        ) : (
          <Track pos={0.5} size="lg" muted />
        )}
      </View>

      {/* Nearest-milestone line */}
      <MilestoneLine ms={nearestMs} />

      {mo > 0 && (
        <Text style={[styles.goalTimeLeft, { color: isPrimary ? colors.accentStrong : colors.text3 }]}>
          {mo} mo left
        </Text>
      )}
    </>
  );
}

function PrimaryGoalCard({
  goal,
  themeColor,
  themeName,
  nearestMs,
  onPress,
}: {
  goal: Goal;
  themeColor: string | null;
  themeName: string | null;
  nearestMs: NearestMilestone | undefined | null;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.goalPrimary} onPress={onPress} activeOpacity={0.85}>
      <GoalCardBody goal={goal} themeColor={themeColor} themeName={themeName} nearestMs={nearestMs} isPrimary />
    </TouchableOpacity>
  );
}

function SecondaryGoalCard({
  goal,
  themeColor,
  themeName,
  nearestMs,
  onPress,
}: {
  goal: Goal;
  themeColor: string | null;
  themeName: string | null;
  nearestMs: NearestMilestone | undefined | null;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.goalCard, { marginBottom: 10 }]} onPress={onPress} activeOpacity={0.85}>
      <GoalCardBody goal={goal} themeColor={themeColor} themeName={themeName} nearestMs={nearestMs} isPrimary={false} />
    </TouchableOpacity>
  );
}

// ─── Past goal card ───────────────────────────────────────────────────────────

export function PastGoalCard({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const resLabel =
    goal.status === 'completed' ? 'Hit' : goal.status === 'archived' ? 'Abandoned' : 'Missed';
  const resColor =
    goal.status === 'completed' ? colors.sage : goal.status === 'archived' ? colors.text3 : colors.brick;
  const dateStr = new Date(
    (goal.completed_at ?? goal.archived_at ?? goal.updated_at)
  ).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <TouchableOpacity style={styles.graveRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.graveRes, { color: resColor }]}>{resLabel}</Text>
      <Text style={styles.graveName} numberOfLines={1}>{goal.title}</Text>
      <Text style={styles.graveDate}>{dateStr}</Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function Goals() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [graveOpen, setGraveOpen] = useState(false);

  const { data: goals, isLoading, isError, refetch } = useGoals();
  const { data: themes } = useThemes();
  const { data: nearestMilestones } = useNearestMilestones();

  const themeMap = Object.fromEntries((themes ?? []).map((t) => [t.id, t]));

  const activeGoals = (goals ?? []).filter((g) => g.status === 'active');
  const primaryGoals = activeGoals.filter((g) => g.goal_type === 'primary');
  const secondaryGoals = activeGoals.filter((g) => g.goal_type === 'secondary');
  const pastGoals = (goals ?? []).filter((g) => g.status !== 'active');

  function openGoal(goal: Goal) {
    router.push({ pathname: '/goal-detail', params: { goalId: goal.id } });
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Page header */}
      <View style={styles.pageHead}>
        <View>
          <Text style={styles.eyebrow}>How each goal is doing</Text>
          <Text style={styles.h1}>Goals</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
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
                nearestMs={nearestMilestones?.[g.id]}
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
                nearestMs={nearestMilestones?.[g.id]}
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
                  {pastGoals.map((g) => (
                    <PastGoalCard key={g.id} goal={g} onPress={() => openGoal(g)} />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

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
  goalPrimary: {
    borderRadius: radius.lg,
    padding: 18,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
    overflow: 'hidden',
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
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: -0.2,
    color: colors.text,
    marginBottom: 10,
  },
  healthRow: {
    marginBottom: 10,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 10.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
  },
  healthLevel: {
    fontSize: 12.5,
    fontWeight: '600',
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
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: 8,
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
