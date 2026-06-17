import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { colors, radius } from '../lib/tokens';
import { useGoals, useMarkGoalHit, useAbandonGoal, useGoalHealthRecords } from '../lib/hooks/useGoals';
import { useThemes } from '../lib/hooks/useThemes';
import { useMilestones, useMarkMilestoneHit } from '../lib/hooks/useMilestones';
import { useGoalTasks, useCompleteTask, useReopenTask } from '../lib/hooks/useTasks';
import { TaskRow } from './components/TaskRow';
import { Track, HealthDots, healthByKey } from './components/HealthTrack';
import { Icon } from './components/Icon';
import { SetNextMilestone } from './components/SetNextMilestone';
import { MilestoneSheet } from './components/MilestoneSheet';

export default function GoalDetail() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: goals } = useGoals();
  const { data: themes } = useThemes();
  const { data: milestones } = useMilestones(goalId ?? null);
  const { data: healthRecords } = useGoalHealthRecords(goalId ?? null);
  const { thisWeek: thisWeekTasksQuery, all: allTasksQuery } = useGoalTasks(goalId ?? null);
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();

  const markGoalHit = useMarkGoalHit();
  const abandonGoal = useAbandonGoal();
  const markMilestoneHit = useMarkMilestoneHit(goalId ?? '');

  const [showSetNext, setShowSetNext] = useState(false);
  const [hitMilestoneTitle, setHitMilestoneTitle] = useState('');
  const [showMilestoneSheet, setShowMilestoneSheet] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  const goal = (goals ?? []).find((g) => g.id === goalId);
  const theme = (themes ?? []).find((t) => t.id === goal?.theme_id);
  const themeMap = Object.fromEntries((themes ?? []).map((t) => [t.id, t]));

  if (!goal) return null;

  const isActive = goal.status === 'active';
  const activeMilestones = (milestones ?? []).filter((m) => m.status === 'active');
  const hitMilestones = (milestones ?? []).filter((m) => m.status === 'hit');

  const eyebrow = [
    theme?.name,
    `by ${new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
  ]
    .filter(Boolean)
    .join(' · ');

  function handleMarkGoalHit() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const id = goal!.id;
    Alert.alert('Mark goal as hit?', 'This will move it to past goals.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark hit', onPress: () => markGoalHit.mutate(id, { onSuccess: () => router.back() }) },
    ]);
  }

  function handleDelete() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const id = goal!.id;
    Alert.alert('Delete goal?', 'It will be archived as abandoned.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => abandonGoal.mutate(id, { onSuccess: () => router.back() }) },
    ]);
  }

  function handleMarkMilestoneHit(milestoneId: string, milestoneTitle: string) {
    markMilestoneHit.mutate(milestoneId, {
      onSuccess: () => {
        setHitMilestoneTitle(milestoneTitle);
        setShowSetNext(true);
      },
    });
  }

  function formatDate(d: string) {
    // date-only strings must get T00:00:00 to parse as local time; timestamps already have time info
    const date = d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Real 8-week trend from health records (newest first from API, reverse for display oldest→newest)
  const trendWeeks: (string | null)[] = (() => {
    const records = healthRecords ?? [];
    const filled: (string | null)[] = records.slice(0, 8).map((r) => r.health_level).reverse();
    // Pad left with nulls to always show 8 slots
    while (filled.length < 8) filled.unshift(null);
    return filled;
  })();

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Modal header */}
      <View style={styles.modalHead}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Icon name="x" size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Goal</Text>
        {isActive ? (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/add-goal', params: { goalId: goal.id } })}
          >
            <Text style={styles.editBtn}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Text style={[styles.eyebrow, { color: isActive ? colors.accentStrong : colors.text3 }]}>
          {eyebrow}
        </Text>
        <Text style={styles.title}>{goal.title}</Text>
        {goal.why ? (
          <Text style={styles.why}>{goal.why}</Text>
        ) : null}

        {/* Health */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Goal health</Text>
            {goal.health_level && (
              <Text style={[styles.healthLevelText, { color: healthByKey(goal.health_level).color }]}>
                {healthByKey(goal.health_level).label}
              </Text>
            )}
          </View>
          {goal.health_level ? (
            <Track pos={healthByKey(goal.health_level).pos} size="lg" />
          ) : (
            <View>
              <Track pos={0.5} size="lg" muted />
              <Text style={styles.mutedHint}>
                {activeMilestones.length === 0
                  ? 'Set a milestone to track this'
                  : 'Not yet rated — set at next Sunday triage'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.hr} />

        {/* Trend */}
        <Text style={styles.trendLabel}>Health trend · 8 weeks</Text>
        <HealthDots weeks={trendWeeks} />

        <View style={styles.hr} />

        {/* Milestones */}
        <Text style={styles.trendLabel}>Milestones</Text>

        {activeMilestones.length === 0 && hitMilestones.length === 0 && (
          <Text style={styles.emptyMilestones}>No milestones yet — add one below.</Text>
        )}

        {activeMilestones.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.milestoneCard}
            onPress={() => { setEditingMilestoneId(m.id); setShowMilestoneSheet(true); }}
            activeOpacity={0.7}
            disabled={!isActive}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.milestoneTitle}>{m.title}</Text>
              <Text style={styles.milestoneDate}>{formatDate(m.target_date)}</Text>
            </View>
            {isActive && (
              <TouchableOpacity
                style={styles.markHitBtn}
                onPress={() => handleMarkMilestoneHit(m.id, m.title)}
                activeOpacity={0.7}
              >
                <Text style={styles.markHitText}>Mark hit</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {hitMilestones.map((m) => (
          <View key={m.id} style={[styles.milestoneCard, styles.milestoneCardHit]}>
            <Icon name="check" size={13} color={colors.sage} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.milestoneTitle, { color: colors.text3 }]}>{m.title}</Text>
              <Text style={styles.milestoneDate}>Hit · {formatDate(m.hit_at ?? m.updated_at)}</Text>
            </View>
          </View>
        ))}

        {isActive && (
          <TouchableOpacity
            style={styles.addMilestone}
            onPress={() => { setEditingMilestoneId(null); setShowMilestoneSheet(true); }}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={15} color={colors.accentStrong} />
            <Text style={styles.addMilestoneText}>Add milestone</Text>
          </TouchableOpacity>
        )}

        {/* Tasks this week */}
        <View style={styles.hr} />
        <Text style={styles.trendLabel}>Tasks this week</Text>
        {(thisWeekTasksQuery.data ?? []).length === 0 ? (
          <Text style={styles.emptyMilestones}>No tasks assigned to this goal this week.</Text>
        ) : (
          (thisWeekTasksQuery.data ?? []).map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              theme={themeMap[task.theme_id]}
              onToggle={() =>
                task.status === 'done'
                  ? reopenTask.mutate(task.id)
                  : completeTask.mutate(task.id)
              }
            />
          ))
        )}

        {/* All tasks for this goal */}
        <View style={styles.hr} />
        <Text style={styles.trendLabel}>All tasks</Text>
        {(allTasksQuery.data ?? []).length === 0 ? (
          <Text style={styles.emptyMilestones}>No tasks linked to this goal yet.</Text>
        ) : (
          (allTasksQuery.data ?? []).map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              theme={themeMap[task.theme_id]}
              onToggle={() =>
                task.status === 'done'
                  ? reopenTask.mutate(task.id)
                  : completeTask.mutate(task.id)
              }
            />
          ))
        )}
      </ScrollView>

      {/* Footer actions */}
      {isActive ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.footerPrimary} onPress={handleMarkGoalHit} activeOpacity={0.8}>
            <Icon name="check" size={16} color="#1a1816" />
            <Text style={styles.footerPrimaryText}>Mark goal as hit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerDelete} onPress={handleDelete} activeOpacity={0.7}>
            <Text style={styles.footerDeleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.footerPrimary, { backgroundColor: colors.accent }]}
            onPress={() => router.push({ pathname: '/add-goal', params: { goalId: goal.id } })}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={16} color="#1a1816" />
            <Text style={styles.footerPrimaryText}>Reactivate</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Set-next-milestone prompt */}
      <SetNextMilestone
        visible={showSetNext}
        milestoneTitle={hitMilestoneTitle}
        onAddNext={() => {
          setShowSetNext(false);
          setEditingMilestoneId(null);
          setShowMilestoneSheet(true);
        }}
        onDismiss={() => setShowSetNext(false)}
      />

      {/* Add/Edit milestone sheet */}
      <MilestoneSheet
        visible={showMilestoneSheet}
        goalId={goalId ?? ''}
        goalTargetDate={goal.target_date}
        milestoneId={editingMilestoneId}
        onClose={() => { setShowMilestoneSheet(false); setEditingMilestoneId(null); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.1,
  },
  editBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentStrong,
    paddingHorizontal: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 25,
    fontWeight: '500',
    letterSpacing: -0.5,
    lineHeight: 30,
    color: colors.text,
    marginBottom: 12,
  },
  why: {
    fontSize: 13.5,
    color: colors.text2,
    lineHeight: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10.5,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
  },
  healthLevelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mutedHint: {
    fontSize: 12,
    color: colors.text3,
    fontStyle: 'italic',
    marginTop: 6,
  },
  hr: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: 20,
  },
  trendLabel: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 12,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  milestoneCardHit: {
    opacity: 0.6,
  },
  milestoneTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  milestoneDate: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
  markHitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: colors.surface2,
  },
  markHitText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.sage,
    letterSpacing: 0.3,
  },
  emptyMilestones: {
    fontSize: 13,
    color: colors.text3,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  addMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  addMilestoneText: {
    fontSize: 14,
    color: colors.accentStrong,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  footerPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.sage,
  },
  footerPrimaryText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1a1816',
  },
  footerDelete: {
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  footerDeleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.brick,
  },
});
