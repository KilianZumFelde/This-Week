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
import { useThisWeekTasks, useCompleteTask, useReopenTask, useDeleteTask, Task } from '../../lib/hooks/useTasks';
import { useHabits, useHabitWeekRecords, useIncrementHabit, useDecrementHabit, Habit } from '../../lib/hooks/useHabits';
import { useUndoStore } from '../../lib/stores/undo-store';
import { useThemes, Theme } from '../../lib/hooks/useThemes';
import { useGoals, useGoalStats } from '../../lib/hooks/useGoals';
import { Ring } from '../components/Ring';
import { Icon } from '../components/Icon';
import { TapFeedback } from '../components/TapFeedback';
import { TaskDetailSheet } from '../components/TaskDetailSheet';
import { SkeletonCard, SkeletonRow, ScreenError } from '../components/Skeleton';
import { HabitDetailSheet } from '../components/HabitDetailSheet';
import { getCurrentWeekStartDate, formatWeekLabel } from '../../lib/week';

// ─── Theme chip ──────────────────────────────────────────────────────────────

function ThemeChip({ theme }: { theme: Theme | undefined }) {
  if (!theme) return null;
  const color = theme.color ?? colors.text2;
  return (
    <View style={[styles.chip, { backgroundColor: `${color}22` }]}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={[styles.chipText, { color }]}>{theme.name}</Text>
    </View>
  );
}

// ─── Priority border ─────────────────────────────────────────────────────────

function derivePriority(effort: string, ret: string): 'high' | 'mid' | 'low' {
  let score: number;
  if      (ret === 'high'   && effort === 'low')    score = 4;
  else if (ret === 'high'   && effort === 'medium') score = 3;
  else if (ret === 'high'   && effort === 'high')   score = 3;
  else if (ret === 'medium' && effort === 'low')    score = 3;
  else if (ret === 'medium' && effort === 'medium') score = 2;
  else if (ret === 'medium' && effort === 'high')   score = 1;
  else if (ret === 'low'    && effort === 'low')    score = 1;
  else if (ret === 'low'    && effort === 'medium') score = 1;
  else if (ret === 'low'    && effort === 'high')   score = 0;
  else score = 2;
  if (score >= 3) return 'high';
  if (score === 2) return 'mid';
  return 'low';
}

const PRIORITY_BORDER: Record<'high' | 'mid' | 'low', string> = {
  high: colors.gold,
  mid: colors.text3,
  low: colors.surfaceHi,
};

// ─── Task row ────────────────────────────────────────────────────────────────

type TaskRowProps = {
  task: {
    id: string;
    title: string;
    status: 'open' | 'done' | 'archived_done';
    effort_level: string;
    return_level: string;
    theme_id: string;
    goal_id: string | null;
  };
  theme: Theme | undefined;
  onToggle: () => void;
  onPressBody: () => void;
};

function TaskRow({ task, theme, onToggle, onPressBody }: TaskRowProps) {
  const done = task.status === 'done';
  const borderColor = done ? colors.surfaceHi : PRIORITY_BORDER[derivePriority(task.effort_level, task.return_level)];
  return (
    <View style={styles.taskRow}>
      <View style={[styles.taskPriorityStripe, { backgroundColor: borderColor }]} />
      <TapFeedback onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
        <View style={[styles.taskCheck, done && styles.taskCheckDone]}>
          {done && <Icon name="check" size={13} color={colors.bg} />}
        </View>
      </TapFeedback>
      <TouchableOpacity style={styles.taskBody} onPress={onPressBody} activeOpacity={0.7}>
        <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{task.title}</Text>
        <View style={styles.taskMeta}>
          <ThemeChip theme={theme} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Habit row ───────────────────────────────────────────────────────────────

type HabitRowProps = {
  habit: {
    id: string;
    title: string;
    status: string;
    weekly_target: number;
    current_streak: number;
    theme_id: string;
  };
  completedCount: number;
  theme: Theme | undefined;
  onIncrement: () => void;
  onPressBody: () => void;
};

function HabitRow({ habit, completedCount, theme, onIncrement, onPressBody }: HabitRowProps) {
  const hit = completedCount >= habit.weekly_target;
  const paused = habit.status === 'paused';

  return (
    <View style={[styles.habitRow, paused && styles.habitRowPaused]}>
      <TapFeedback
        onPress={onIncrement}
        disabled={paused}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ring value={completedCount} target={habit.weekly_target} dim={paused} />
      </TapFeedback>
      <TouchableOpacity style={styles.habitBody} onPress={onPressBody} activeOpacity={0.7}>
        <View style={styles.habitTitleRow}>
          <Text style={[styles.habitTitle, paused && styles.habitTitlePaused]}>{habit.title}</Text>
          {paused && <Text style={styles.pausedBadge}>PAUSED</Text>}
        </View>
        <View style={styles.habitMeta}>
          <ThemeChip theme={theme} />
          {!paused && habit.current_streak > 0 && (
            <View style={[styles.chip, { backgroundColor: colors.goldDim }]}>
              <Icon name="flame" size={10} color={colors.gold} />
              <Text style={[styles.chipText, { color: colors.gold }]}>
                {habit.current_streak} wk
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {hit && !paused && (
        <Text style={styles.habitHit}>HIT</Text>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ThisWeek() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [doneOpen, setDoneOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const { data: tasks, isLoading: tasksLoading, isError: tasksError, refetch: refetchTasks } = useThisWeekTasks();
  const { data: habits, isLoading: habitsLoading, isError: habitsError, refetch: refetchHabits } = useHabits();
  const { data: weekRecords } = useHabitWeekRecords();
  const { data: themes } = useThemes();
  const { data: goals } = useGoals();

  const primaryGoal = (goals ?? []).find((g) => g.goal_type === 'primary' && g.status === 'active') ?? null;
  const { data: primaryGoalStats } = useGoalStats(primaryGoal?.id ?? null);
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();
  const deleteTask = useDeleteTask();
  const incrementHabit = useIncrementHabit();
  const decrementHabit = useDecrementHabit();
  const showUndo = useUndoStore((s) => s.show);

  const recordMap = Object.fromEntries(
    (weekRecords ?? []).map((r) => [r.habit_id, r]),
  );

  const themeMap = Object.fromEntries((themes ?? []).map((t) => [t.id, t]));

  const openTasks = (tasks ?? []).filter((t) => t.status === 'open');
  const doneTasks = (tasks ?? []).filter((t) => t.status === 'done');

  // Priority score from effort × return matrix
  function priorityScore(effort: string, ret: string): number {
    if (ret === 'high'   && effort === 'low')    return 4;
    if (ret === 'high'   && effort === 'medium') return 3;
    if (ret === 'high'   && effort === 'high')   return 3;
    if (ret === 'medium' && effort === 'low')    return 3;
    if (ret === 'medium' && effort === 'medium') return 2;
    if (ret === 'medium' && effort === 'high')   return 1;
    if (ret === 'low'    && effort === 'low')    return 1;
    if (ret === 'low'    && effort === 'medium') return 1;
    if (ret === 'low'    && effort === 'high')   return 0;
    return 2; // unknown → treat as medium/medium
  }

  // Flat list sorted by priority score desc, oldest first on ties
  const prioritySortedTasks = [...openTasks].sort((a, b) => {
    const diff = priorityScore(b.effort_level, b.return_level) - priorityScore(a.effort_level, a.return_level);
    if (diff !== 0) return diff;
    return a.created_at < b.created_at ? -1 : 1;
  });

  const weekStart = getCurrentWeekStartDate();
  const weekLabel = formatWeekLabel(weekStart);

  const isEmpty = !tasksLoading && !habitsLoading && openTasks.length === 0 && (habits ?? []).length === 0;

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Page header */}
      <View style={styles.pageHead}>
        <View>
          <Text style={styles.eyebrow}>Week of {weekLabel}</Text>
          <Text style={styles.h1}>This week</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
          <Icon name="settings" size={20} color={colors.text2} />
        </TouchableOpacity>
      </View>

      {tasksLoading || habitsLoading ? (
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 140 }}>
          <SkeletonCard height={140} />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonCard height={8} />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </ScrollView>
      ) : (tasksError || habitsError) ? (
        <ScreenError onRetry={() => { refetchTasks(); refetchHabits(); }} />
      ) : isEmpty ? (
        // Empty state
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <View style={styles.emptyCircle} />
            <View style={styles.emptyDot} />
          </View>
          <Text style={styles.emptyTitle}>This is your week.</Text>
          <Text style={styles.emptySubtitle}>
            Start by setting a goal you actually want to work toward — or just add a task.
          </Text>
          <TouchableOpacity style={styles.btnPrimary}>
            <Icon name="sparkles" size={16} color={colors.bg} />
            <Text style={styles.btnPrimaryText}>Set my first goal with Coach</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Add a task</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => { refetchTasks(); refetchHabits(); }}
              tintColor={colors.accent}
            />
          }
        >
          {/* Milestone hero */}
          <View style={styles.milestone}>
            <View style={styles.milestoneEyebrow}>
              <Icon name="target" size={12} color={colors.accentStrong} />
              <Text style={styles.milestoneEyebrowText}>Primary milestone</Text>
            </View>
            {primaryGoal ? (
              <>
                <Text style={styles.milestoneTitle}>{primaryGoal.title}</Text>
                <View style={styles.milestoneMeta}>
                  <View style={styles.milestonePill}>
                    <Text style={styles.milestonePillText}>
                      {new Date(primaryGoal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.milestoneMetaText}>
                    {primaryGoalStats?.tasks_this_week ?? 0} tasks this week toward this
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.milestoneTitle}>No active goal yet</Text>
                <View style={styles.milestoneMeta}>
                  <Text style={styles.milestoneMetaText}>{openTasks.length} tasks this week</Text>
                </View>
              </>
            )}
          </View>

          {/* Habits section */}
          {(habits ?? []).length > 0 && (
            <>
              <View style={styles.sectionLabel}>
                <Text style={styles.sectionLabelText}>Habits</Text>
                <Text style={styles.sectionLabelCount}>
                  {(habits ?? []).filter((h) => {
                    if (h.status !== 'active') return false;
                    const r = recordMap[h.id];
                    return (r?.completed_count ?? 0) >= h.weekly_target;
                  }).length}/{(habits ?? []).filter((h) => h.status === 'active').length} on target
                </Text>
              </View>
              {(habits ?? []).map((habit) => {
                const record = recordMap[habit.id];
                const completedCount = record?.completed_count ?? 0;
                return (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    completedCount={completedCount}
                    theme={themeMap[habit.theme_id]}
                    onIncrement={() =>
                      incrementHabit.mutate(habit.id, {
                        onSuccess: () =>
                          showUndo({
                            label: `"${habit.title}" logged`,
                            undo: () => decrementHabit.mutate(habit.id),
                          }),
                      })
                    }
                    onPressBody={() => setSelectedHabit(habit)}
                  />
                );
              })}
            </>
          )}

          {/* Tasks section */}
          {openTasks.length > 0 && (
            <>
              <View style={[styles.sectionLabel, { marginTop: 26 }]}>
                <Text style={styles.sectionLabelText}>Tasks · {openTasks.length}</Text>
              </View>
              {prioritySortedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  theme={themeMap[task.theme_id]}
                  onToggle={() => {
                    completeTask.mutate(task.id);
                    showUndo({
                      label: `"${task.title}" marked done`,
                      undo: () => reopenTask.mutate(task.id),
                    });
                  }}
                  onPressBody={() => setSelectedTask(task)}
                />
              ))}
            </>
          )}

          {/* Done bar */}
          {doneTasks.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.doneBar}
                onPress={() => setDoneOpen((o) => !o)}
                activeOpacity={0.7}
              >
                <View style={styles.doneBarLabel}>
                  <Icon
                    name={doneOpen ? 'chevron-down' : 'chevron-right'}
                    size={14}
                    color={colors.text2}
                  />
                  <Text style={styles.doneBarText}>Done ({doneTasks.length})</Text>
                </View>
              </TouchableOpacity>
              {doneOpen &&
                doneTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    theme={themeMap[task.theme_id]}
                    onToggle={() => reopenTask.mutate(task.id)}
                    onPressBody={() => {/* open task detail */}}
                  />
                ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Detail sheets */}
      <TaskDetailSheet
        task={selectedTask}
        themes={themes ?? []}
        onClose={() => setSelectedTask(null)}
      />
      <HabitDetailSheet
        habit={selectedHabit}
        weekRecord={selectedHabit ? recordMap[selectedHabit.id] : undefined}
        themes={themes ?? []}
        onClose={() => setSelectedHabit(null)}
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
    gap: 12,
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
  // Milestone
  milestone: {
    borderRadius: radius.lg,
    padding: 18,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    marginBottom: 4,
    overflow: 'hidden',
  },
  milestoneEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  milestoneEyebrowText: {
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accentStrong,
    fontWeight: '600',
  },
  milestoneTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 26,
    letterSpacing: -0.22,
    color: colors.text,
    marginBottom: 12,
  },
  milestoneMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  milestoneMetaText: {
    fontSize: 12.5,
    color: colors.text2,
  },
  milestonePill: {
    backgroundColor: 'rgba(255,245,232,0.06)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  milestonePillText: {
    fontSize: 12.5,
    color: colors.text2,
  },
  // Section label
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
  // Task row
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: 8,
    overflow: 'hidden',
  },
  taskPriorityStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  taskCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.text3,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskCheckDone: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  taskBody: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: 14.5,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 19.5,
    marginBottom: 6,
  },
  taskTitleDone: {
    color: colors.text3,
    textDecorationLine: 'line-through',
    textDecorationColor: colors.text3,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
  },
  // Habit row
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  habitRowPaused: {
    opacity: 0.45,
  },
  habitBody: {
    flex: 1,
    minWidth: 0,
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  habitTitle: {
    fontSize: 14.5,
    fontWeight: '500',
    color: colors.text,
  },
  habitTitlePaused: {
    color: colors.text3,
  },
  pausedBadge: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text3,
    borderWidth: 1,
    borderColor: colors.text3,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  habitMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  habitHit: {
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  // Chips
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.surface2,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.85,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.text2,
  },
  // Done bar
  doneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  // Empty state
  emptyState: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 140,
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  emptyCircle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  emptyTitle: {
    fontFamily: 'Georgia',
    fontSize: 26,
    fontWeight: '500',
    letterSpacing: -0.4,
    lineHeight: 31,
    color: colors.text,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.text2,
    lineHeight: 23,
    marginBottom: 28,
    maxWidth: 280,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: 10,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.bg,
  },
  btnGhost: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline2,
  },
  btnGhostText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
});
