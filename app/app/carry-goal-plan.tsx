import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { colors, radius, fonts } from '../lib/tokens';
import { Icon } from './components/Icon';
import { useGoals } from '../lib/hooks/useGoals';
import { useMilestones } from '../lib/hooks/useMilestones';
import { useThemes } from '../lib/hooks/useThemes';
import { useGoalTasks, useUpdateTask, useCreateTask, Task } from '../lib/hooks/useTasks';
import { useRolloverStore } from '../lib/stores/rollover-store';
import { getCurrentWeekStartDate } from '../lib/week';
import { api } from '../lib/api';

type AiSuggestion = {
  title: string;
  theme_id?: string | null;
  effort_level?: string | null;
  return_level?: string | null;
};

const EFFORT_LABELS: Record<string, string> = {
  low: '· low effort',
  medium: '· med effort',
  high: '· high effort',
};

export default function CarryGoalPlan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { goalIndex, setGoalIndex } = useRolloverStore();

  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: themes } = useThemes();
  const activeGoals = (goals ?? []).filter((g) => g.status === 'active');
  const goal = activeGoals[goalIndex] ?? null;
  const totalGoals = activeGoals.length;

  const themeMap = new Map((themes ?? []).map((t) => [t.id, t]));
  const goalTheme = goal?.theme_id ? themeMap.get(goal.theme_id) : null;
  const eyebrowColor = goalTheme?.color ?? colors.accentStrong;

  const { data: milestones } = useMilestones(goal?.id ?? null);
  const { all: goalTasksQuery } = useGoalTasks(goal?.id ?? null);
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();

  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [confirmedSuggestions, setConfirmedSuggestions] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const nearestMilestone = useMemo(() => {
    const active = (milestones ?? []).filter((m) => m.status === 'active');
    return active.slice().sort((a, b) => a.target_date.localeCompare(b.target_date))[0] ?? null;
  }, [milestones]);

  const backlogGoalTasks = useMemo(() => {
    return (goalTasksQuery.data ?? []).filter(
      (t: Task) => t.week_assignment === 'backlog' && t.status === 'open',
    );
  }, [goalTasksQuery.data]);

  async function toggleAddTask(task: Task) {
    const weekStart = getCurrentWeekStartDate();
    if (addedIds.has(task.id)) return; // no un-add once committed
    setAddedIds((prev) => new Set(prev).add(task.id));
    await updateTask.mutateAsync({
      id: task.id,
      week_assignment: 'this_week',
      week_start_date: weekStart,
    });
  }

  async function loadAiSuggestions() {
    if (!goal || aiLoading) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const existingTitles = [
        ...(backlogGoalTasks.map((t: Task) => t.title)),
        ...(aiSuggestions.map((s) => s.title)),
      ];
      const res = await api.post<{ items: AiSuggestion[] }>('/ai/suggest-goal-tasks', {
        goal: {
          id: goal.id,
          title: goal.title,
          why: goal.why,
          target_date: goal.target_date,
          health_level: goal.health_level,
        },
        nearest_milestone: nearestMilestone
          ? { title: nearestMilestone.title, target_date: nearestMilestone.target_date }
          : null,
        existing_task_titles: existingTitles,
        themes: (themes ?? []).map((t) => ({ id: t.id, name: t.name })),
      });
      setAiSuggestions(res.items ?? []);
    } catch {
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  }

  async function confirmSuggestion(idx: number, suggestion: AiSuggestion) {
    if (!goal || confirmedSuggestions.has(idx)) return;
    const weekStart = getCurrentWeekStartDate();
    const themeId = suggestion.theme_id ?? (goal.theme_id ?? (themes?.[0]?.id ?? ''));
    await createTask.mutateAsync({
      title: suggestion.title,
      theme_id: themeId,
      goal_id: goal.id,
      week_assignment: 'this_week',
      effort_level: (suggestion.effort_level as any) ?? 'unknown',
      return_level: (suggestion.return_level as any) ?? 'unknown',
    });
    setConfirmedSuggestions((prev) => new Set(prev).add(idx));
  }

  async function handleNext() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await qc.invalidateQueries({ queryKey: ['tasks'] });
      const nextIndex = goalIndex + 1;
      if (nextIndex < activeGoals.length) {
        setGoalIndex(nextIndex);
        router.replace('/carry-goal-reflect');
      } else {
        router.replace('/carry-pull');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (goalsLoading || !goal) {
    return (
      <View style={[styles.page, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 80 }} />
      </View>
    );
  }

  const isLastGoal = goalIndex + 1 >= totalGoals;

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.modalHead}>
        <Text style={styles.stepLabel}>
          SUNDAY SET-UP · GOAL {goalIndex + 1} OF {totalGoals} · PLAN
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step dots: reflect (sage) | plan (accent) */}
        <View style={styles.stepDots}>
          <View style={[styles.stepDot, { backgroundColor: colors.sage }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.accent }]} />
        </View>

        {/* Goal eyebrow + title */}
        <Text style={[styles.eyebrow, { color: eyebrowColor }]}>
          {goalTheme?.name ?? (goal.goal_type === 'primary' ? 'Primary goal' : 'Secondary goal')}
        </Text>
        <Text style={styles.goalTitle}>{goal.title}</Text>

        {nearestMilestone && (
          <View style={styles.msLine}>
            <Icon name="target" size={14} color={colors.text3} />
            <Text style={styles.msText}>
              <Text style={styles.msLabel}>Toward: </Text>
              {nearestMilestone.title}
            </Text>
          </View>
        )}

        {/* Pull in this week's work */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>PULL IN THIS WEEK'S WORK</Text>
          <Text style={styles.sectionHint}>+ to add new</Text>
        </View>

        {goalTasksQuery.isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
        ) : backlogGoalTasks.length === 0 ? (
          <Text style={styles.emptyHint}>No backlog tasks for this goal yet.</Text>
        ) : (
          backlogGoalTasks.map((task: Task) => {
            const isAdded = addedIds.has(task.id);
            const theme = themeMap.get(task.theme_id);
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskRow, isAdded && styles.taskRowAdded]}
                onPress={() => toggleAddTask(task)}
                activeOpacity={0.8}
                disabled={isAdded}
              >
                <View style={[styles.check, isAdded && styles.checkAdded]}>
                  {isAdded
                    ? <Icon name="check" size={13} color={colors.bg} />
                    : <Icon name="plus" size={12} color={colors.text3} />
                  }
                </View>
                <View style={styles.taskBody}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {(theme || task.effort_level) && (
                    <View style={styles.chipRow}>
                      {theme && (
                        <View style={[styles.chip, { backgroundColor: `${theme.color ?? colors.text2}22` }]}>
                          <View style={[styles.chipDot, { backgroundColor: theme.color ?? colors.text2 }]} />
                          <Text style={[styles.chipText, { color: theme.color ?? colors.text2 }]}>{theme.name}</Text>
                        </View>
                      )}
                      {task.effort_level && EFFORT_LABELS[task.effort_level] && (
                        <View style={[styles.chip, { backgroundColor: colors.surface2 }]}>
                          <Text style={[styles.chipText, { color: colors.text2 }]}>
                            {EFFORT_LABELS[task.effort_level]}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                {isAdded && <Text style={styles.addedBadge}>ADDED</Text>}
              </TouchableOpacity>
            );
          })
        )}

        {/* AI suggestions */}
        <TouchableOpacity
          style={styles.aiBtn}
          onPress={loadAiSuggestions}
          disabled={aiLoading}
          activeOpacity={0.8}
        >
          {aiLoading
            ? <ActivityIndicator size="small" color={colors.accentStrong} />
            : <Icon name="sparkles" size={15} color={colors.accentStrong} />
          }
          <Text style={styles.aiBtnText}>Anything to add?</Text>
        </TouchableOpacity>

        {aiSuggestions.length > 0 && (
          <>
            <Text style={styles.aiHint}>Tap to confirm — nothing is added automatically.</Text>
            {aiSuggestions.map((s, idx) => {
              const confirmed = confirmedSuggestions.has(idx);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.taskRow, confirmed && styles.taskRowAdded]}
                  onPress={() => confirmSuggestion(idx, s)}
                  activeOpacity={0.8}
                  disabled={confirmed}
                >
                  <View style={[styles.check, confirmed && styles.checkAdded]}>
                    {confirmed
                      ? <Icon name="check" size={13} color={colors.bg} />
                      : <Icon name="plus" size={12} color={colors.text3} />
                    }
                  </View>
                  <View style={styles.taskBody}>
                    <Text style={styles.taskTitle}>{s.title}</Text>
                    {(s.effort_level && s.effort_level !== 'unknown' && EFFORT_LABELS[s.effort_level]) && (
                      <View style={styles.chipRow}>
                        <View style={[styles.chip, { backgroundColor: colors.surface2 }]}>
                          <Text style={[styles.chipText, { color: colors.text2 }]}>
                            {EFFORT_LABELS[s.effort_level]}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                  {confirmed && <Text style={styles.addedBadge}>ADDED</Text>}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Quick-add new task */}
        <TouchableOpacity
          style={styles.newTaskBtn}
          onPress={() => router.push('/quick-add?defaultWeek=this_week')}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={15} color={colors.text3} />
          <Text style={styles.newTaskBtnText}>New task</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
          onPress={handleNext}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>{isLastGoal ? 'Continue' : 'Next goal'}</Text>
          <Icon name="arrow" size={16} color={colors.bg} />
        </TouchableOpacity>
        <Text style={styles.footnote}>Pulling tasks is optional</Text>
      </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.text3,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingTop: 4,
    flexGrow: 1,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  stepDot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 6,
  },
  goalTitle: {
    fontFamily: fonts.serif,
    fontSize: 21,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.21,
    lineHeight: 26,
    marginBottom: 10,
  },
  msLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
  },
  msText: {
    fontSize: 13,
    color: colors.text2,
    flex: 1,
  },
  msLabel: {
    fontWeight: '600',
    color: colors.text3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.text3,
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: 11.5,
    color: colors.text3,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.text3,
    marginBottom: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  taskRowAdded: {
    backgroundColor: 'rgba(142,160,118,0.12)',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.text3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  checkAdded: {
    borderWidth: 0,
    borderStyle: 'solid',
    backgroundColor: colors.sage,
  },
  taskBody: {
    flex: 1,
    gap: 6,
  },
  taskTitle: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addedBadge: {
    fontSize: 10.5,
    color: colors.sage,
    letterSpacing: 1,
    fontWeight: '700',
    flexShrink: 0,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.hairline2,
    paddingVertical: 11,
    marginTop: 4,
    marginBottom: 4,
  },
  aiBtnText: {
    fontSize: 13.5,
    color: colors.accentStrong,
    fontWeight: '500',
  },
  aiHint: {
    fontSize: 11.5,
    color: colors.text3,
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  newTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  newTaskBtnText: {
    fontSize: 13,
    color: colors.text3,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 6,
    backgroundColor: colors.bg,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  footnote: {
    fontSize: 11.5,
    color: colors.text3,
    textAlign: 'center',
  },
});
