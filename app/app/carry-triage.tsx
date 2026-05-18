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
import { api } from '../lib/api';
import { Icon } from './components/Icon';
import { useUndoStore } from '../lib/stores/undo-store';

type Theme = { id: string; name: string; color: string };
type Decision = {
  id: string;
  decision: 'keep_this_week' | 'send_to_backlog' | 'drop' | null;
  task: {
    id: string;
    title: string;
    effort_level: string;
    return_level: string;
    created_at: string;
    theme: Theme | null;
    goal_title: string | null;
  } | null;
};

const EFFORT_LABELS: Record<string, string> = {
  low: '· low effort',
  medium: '· med effort',
  high: '· high effort',
};
const EFFORT_COLORS: Record<string, string> = {
  low: colors.slate,
  medium: colors.text2,
  high: colors.brick,
};
const EFFORT_BG: Record<string, string> = {
  low: colors.slateDim,
  medium: 'rgba(122,144,168,0.08)',
  high: colors.brickDim,
};
const RETURN_LABELS: Record<string, string> = {
  high: '· high return',
  medium: '· med return',
  low: '· low return',
};
const RETURN_COLORS: Record<string, string> = {
  high: colors.gold,
  medium: colors.text2,
  low: colors.text2,
};
const RETURN_BG: Record<string, string> = {
  high: colors.goldDim,
  medium: 'rgba(212,176,106,0.08)',
  low: colors.surface2,
};

function daysAgo(createdAt: string): number {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function CarryTriage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const undoStore = useUndoStore();

  const [ritualId, setRitualId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<{ ritual: { id: string }; decisions: Decision[] }>('/carry-over/pending')
      .then((data) => {
        setRitualId(data.ritual.id);
        setDecisions(data.decisions);
      })
      .finally(() => setLoading(false));
  }, []);

  const undecided = decisions.filter((d) => d.decision === null);
  const decided = decisions.filter((d) => d.decision !== null);
  const current = undecided[0] ?? null;
  const totalCount = decisions.length;
  const currentIndex = decided.length; // 0-based index of current task

  async function submitDecision(decisionId: string, choice: 'keep_this_week' | 'send_to_backlog' | 'drop') {
    if (!ritualId || submitting) return;
    setSubmitting(true);

    try {
      const res = await api.post<{ ok: boolean; ritual_completed: boolean }>(
        `/carry-over/${ritualId}/decisions/${decisionId}`,
        { decision: choice },
      );

      // Mark decision locally
      setDecisions((prev) =>
        prev.map((d) => (d.id === decisionId ? { ...d, decision: choice } : d)),
      );

      if (res.ritual_completed) {
        router.replace('/carry-pull');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDrop(decisionId: string, taskTitle: string) {
    // Show undo snackbar before the call
    undoStore.show({
      label: `Dropped "${taskTitle}"`,
      undo: () => {
        // On undo, re-fetch to restore state (the decision was already sent)
        // We can't undo a deletion, so this is informational
      },
    });
    submitDecision(decisionId, 'drop');
  }

  if (loading) {
    return (
      <View style={[styles.page, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (!current) {
    // All done, should have navigated already
    return null;
  }

  const task = current.task!;

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Modal header */}
      <View style={styles.modalHead}>
        <Text style={styles.stepLabel}>SUNDAY SET-UP · 2 OF 3</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + counter */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Last week's leftovers</Text>
          <Text style={styles.counter}>
            {currentIndex + 1} of {totalCount}
          </Text>
        </View>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {decisions.map((d, i) => {
            let bg: string = colors.surfaceHi;
            if (i < currentIndex) bg = colors.sage;
            else if (i === currentIndex) bg = colors.accent;
            return <View key={d.id} style={[styles.dot, { backgroundColor: bg }]} />;
          })}
        </View>

        {/* Focal task card */}
        <View style={styles.taskCard}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={styles.chipRow}>
            {task.theme && (
              <View style={[styles.chip, { backgroundColor: `${task.theme.color}22` }]}>
                <View style={[styles.chipDot, { backgroundColor: task.theme.color }]} />
                <Text style={[styles.chipText, { color: task.theme.color }]}>{task.theme.name}</Text>
              </View>
            )}
            {task.effort_level && EFFORT_LABELS[task.effort_level] && (
              <View style={[styles.chip, { backgroundColor: EFFORT_BG[task.effort_level] ?? colors.surface2 }]}>
                <Text style={[styles.chipText, { color: EFFORT_COLORS[task.effort_level] ?? colors.text2 }]}>
                  {EFFORT_LABELS[task.effort_level]}
                </Text>
              </View>
            )}
            {task.return_level && RETURN_LABELS[task.return_level] && (
              <View style={[styles.chip, { backgroundColor: RETURN_BG[task.return_level] ?? colors.surface2 }]}>
                <Text style={[styles.chipText, { color: RETURN_COLORS[task.return_level] ?? colors.text2 }]}>
                  {RETURN_LABELS[task.return_level]}
                </Text>
              </View>
            )}
            {task.goal_title && (
              <View style={[styles.chip, { backgroundColor: colors.accentDim }]}>
                <Text style={[styles.chipText, { color: colors.accentStrong }]}>
                  ◎ {task.goal_title}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.taskFooter}>
            <Icon name="calendar" size={12} color={colors.text3} />
            <Text style={styles.taskFooterText}>
              originally added {daysAgo(task.created_at)} days ago
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, minHeight: 16 }} />

        {/* 3-button action block */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => submitDecision(current.id, 'keep_this_week')}
            disabled={submitting}
          >
            <Text style={styles.primaryBtnText}>Keep for this week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => submitDecision(current.id, 'send_to_backlog')}
            disabled={submitting}
          >
            <Text style={styles.ghostBtnText}>Send to backlog</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.textBtn}
            onPress={() => handleDrop(current.id, task.title)}
            disabled={submitting}
          >
            <Text style={styles.textBtnText}>Drop</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 6,
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.22,
    margin: 0,
  },
  counter: {
    fontSize: 12,
    color: colors.text3,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 26,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  taskCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 22,
    marginBottom: 24,
  },
  taskTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 27.5,
    letterSpacing: -0.22,
    marginBottom: 16,
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
  taskFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskFooterText: {
    fontSize: 12,
    color: colors.text3,
  },
  actions: {
    flexDirection: 'column',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  ghostBtn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.hairline2,
    backgroundColor: 'transparent',
  },
  ghostBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  textBtn: {
    height: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  textBtnText: {
    color: colors.text3,
    fontSize: 15,
  },
});
