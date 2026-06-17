import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, fonts } from '../lib/tokens';
import { Icon } from './components/Icon';
import { useGoals, ProgressAnswer, ConfidenceAnswer, useSetGoalHealth } from '../lib/hooks/useGoals';
import { useMilestones, useMarkMilestoneHit } from '../lib/hooks/useMilestones';
import { useThemes } from '../lib/hooks/useThemes';
import { MilestoneSheet } from './components/MilestoneSheet';
import { SetNextMilestone } from './components/SetNextMilestone';
import { useRolloverStore } from '../lib/stores/rollover-store';
import { getCurrentWeekStartDate } from '../lib/week';

const PROGRESS_OPTIONS: { label: string; value: ProgressAnswer }[] = [
  { label: 'A lot', value: 'a_lot' },
  { label: 'Some', value: 'some' },
  { label: 'Barely', value: 'barely' },
  { label: 'Nothing', value: 'nothing' },
];

const CONFIDENCE_OPTIONS: { label: string; value: ConfidenceAnswer }[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'Maybe', value: 'maybe' },
  { label: 'No', value: 'no' },
];

export default function CarryGoalReflect() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goalIndex, setGoalIndex } = useRolloverStore();

  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: themes } = useThemes();
  const activeGoals = (goals ?? []).filter((g) => g.status === 'active');
  const goal = activeGoals[goalIndex] ?? null;
  const totalGoals = activeGoals.length;

  const themeMap = new Map((themes ?? []).map((t) => [t.id, t]));
  const goalTheme = goal?.theme_id ? themeMap.get(goal.theme_id) : null;
  const eyebrowColor = goalTheme?.color ?? colors.accentStrong;

  const { data: milestones, isLoading: milestonesLoading } = useMilestones(goal?.id ?? null);
  const setGoalHealth = useSetGoalHealth();
  const markMilestoneHit = useMarkMilestoneHit(goal?.id ?? '');

  const [progress, setProgress] = useState<ProgressAnswer | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceAnswer | null>(null);
  const [showMilestoneSheet, setShowMilestoneSheet] = useState(false);
  const [editMilestoneId, setEditMilestoneId] = useState<string | null>(null);
  const [showSetNext, setShowSetNext] = useState(false);
  const [hitMilestoneTitle, setHitMilestoneTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // No active goals → skip to pull
  useEffect(() => {
    if (!goalsLoading && activeGoals.length === 0) {
      router.replace('/carry-pull');
    }
  }, [goalsLoading, activeGoals.length]);

  // Past last goal → skip to pull
  useEffect(() => {
    if (!goalsLoading && activeGoals.length > 0 && goalIndex >= activeGoals.length) {
      router.replace('/carry-pull');
    }
  }, [goalsLoading, goalIndex, activeGoals.length]);

  // Reset answers when switching goals
  useEffect(() => {
    setProgress(null);
    setConfidence(null);
  }, [goal?.id]);

  if (goalsLoading || !goal) {
    return (
      <View style={[styles.page, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 80 }} />
      </View>
    );
  }

  const activeMilestones = (milestones ?? []).filter((m) => m.status === 'active');
  const today = new Date().toISOString().slice(0, 10);
  const nearestMilestone = activeMilestones
    .slice()
    .sort((a, b) => a.target_date.localeCompare(b.target_date))[0] ?? null;
  const isGapCatch = !milestonesLoading && activeMilestones.length === 0;
  const isOverdue = !!nearestMilestone && nearestMilestone.target_date < today;

  const ready = isGapCatch || (progress !== null && confidence !== null);

  async function handlePlanThisWeek() {
    if (!ready || submitting) return;
    setSubmitting(true);
    try {
      if (!isGapCatch && progress && confidence) {
        await setGoalHealth.mutateAsync({
          goalId: goal!.id,
          progress_answer: progress,
          confidence_answer: confidence,
          week_start_date: getCurrentWeekStartDate(),
        });
      }
      router.replace('/carry-goal-plan');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkHit() {
    if (!nearestMilestone) return;
    await markMilestoneHit.mutateAsync(nearestMilestone.id);
    setHitMilestoneTitle(nearestMilestone.title);
    setShowSetNext(true);
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.modalHead}>
        <Text style={styles.stepLabel}>
          SUNDAY SET-UP · GOAL {goalIndex + 1} OF {totalGoals} · REFLECT
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step dots: reflect (accent) | plan (surfaceHi) */}
        <View style={styles.stepDots}>
          <View style={[styles.stepDot, { backgroundColor: colors.accent }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.surfaceHi }]} />
        </View>

        {/* Goal eyebrow + title */}
        <Text style={[styles.eyebrow, { color: eyebrowColor }]}>
          {goalTheme?.name ?? (goal.goal_type === 'primary' ? 'Primary goal' : 'Secondary goal')}
        </Text>
        <Text style={styles.goalTitle}>{goal.title}</Text>

        {milestonesLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : isGapCatch ? (
          /* Gap-catch: no active milestone */
          <View style={styles.gapCatchCard}>
            <Text style={styles.gapCatchTitle}>No milestone to reflect on yet</Text>
            <Text style={styles.gapCatchBody}>
              Add a near-term milestone so this goal has something concrete to track against.
            </Text>
            <TouchableOpacity
              style={styles.addMilestoneBtn}
              onPress={() => { setEditMilestoneId(null); setShowMilestoneSheet(true); }}
              activeOpacity={0.8}
            >
              <Icon name="plus" size={15} color={colors.bg} />
              <Text style={styles.addMilestoneBtnText}>Add milestone</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Milestone line */}
            <View style={[styles.msLine, isOverdue && styles.msLineOverdue]}>
              <Icon
                name={isOverdue ? 'bell' : 'target'}
                size={14}
                color={isOverdue ? colors.brick : colors.text3}
              />
              <Text style={[styles.msText, isOverdue && styles.msTextOverdue]}>
                <Text style={styles.msLabel}>Milestone: </Text>
                {nearestMilestone!.title}
                {isOverdue ? ' · overdue' : ` · due ${nearestMilestone!.target_date}`}
              </Text>
            </View>

            {isOverdue && (
              <View style={styles.overdueActions}>
                <TouchableOpacity
                  style={styles.overdueBtn}
                  onPress={handleMarkHit}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.overdueBtnText, { color: colors.sage }]}>Mark hit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.overdueBtn}
                  onPress={() => { setEditMilestoneId(nearestMilestone!.id); setShowMilestoneSheet(true); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.overdueBtnText, { color: colors.text2 }]}>Push date</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Progress question */}
            <Text style={styles.question}>How much did you move toward it this week?</Text>
            <View style={styles.chipGroup}>
              {PROGRESS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, progress === opt.value && styles.chipOn]}
                  onPress={() => setProgress(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, progress === opt.value && styles.chipTextOn]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Confidence question */}
            <Text style={[styles.question, { marginTop: 24 }]}>
              Confident you'll hit it by{' '}
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {nearestMilestone!.target_date}
              </Text>
              ?
            </Text>
            <View style={styles.chipGroup}>
              {CONFIDENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, confidence === opt.value && styles.chipOn]}
                  onPress={() => setConfidence(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, confidence === opt.value && styles.chipTextOn]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ flex: 1, minHeight: 20 }} />

        <TouchableOpacity
          style={[styles.primaryBtn, (!ready || submitting) && { opacity: 0.45 }]}
          onPress={handlePlanThisWeek}
          disabled={!ready || submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Plan this week</Text>
          <Icon name="arrow" size={16} color={colors.bg} />
        </TouchableOpacity>
        {!isGapCatch && !ready && (
          <Text style={styles.hint}>Answer both to continue</Text>
        )}
      </ScrollView>

      <SetNextMilestone
        visible={showSetNext}
        milestoneTitle={hitMilestoneTitle}
        onAddNext={() => {
          setShowSetNext(false);
          setEditMilestoneId(null);
          setShowMilestoneSheet(true);
        }}
        onDismiss={() => setShowSetNext(false)}
      />

      {goal && (
        <MilestoneSheet
          visible={showMilestoneSheet}
          goalId={goal.id}
          goalTargetDate={goal.target_date}
          milestoneId={editMilestoneId}
          onClose={() => { setShowMilestoneSheet(false); setEditMilestoneId(null); }}
        />
      )}
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
    padding: 24,
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
    fontSize: 24,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.36,
    lineHeight: 29,
    marginBottom: 16,
  },
  gapCatchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline2,
    padding: 18,
    marginTop: 6,
  },
  gapCatchTitle: {
    fontSize: 14.5,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 6,
  },
  gapCatchBody: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 19,
    marginBottom: 16,
  },
  addMilestoneBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  addMilestoneBtnText: {
    color: colors.bg,
    fontSize: 13.5,
    fontWeight: '600',
  },
  msLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 26,
  },
  msLineOverdue: {
    marginBottom: 10,
  },
  msText: {
    fontSize: 13,
    color: colors.text2,
    flex: 1,
  },
  msTextOverdue: {
    color: colors.brick,
  },
  msLabel: {
    fontWeight: '600',
    color: colors.text3,
  },
  overdueActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 26,
  },
  overdueBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  overdueBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  question: {
    fontSize: 14,
    color: colors.text2,
    lineHeight: 20,
    marginBottom: 12,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.hairline2,
  },
  chipOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 14,
    color: colors.text2,
    fontWeight: '500',
  },
  chipTextOn: {
    color: colors.bg,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  primaryBtnText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  hint: {
    fontSize: 11.5,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 10,
  },
});
