import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { colors, radius, fonts } from '../lib/tokens';
import { api } from '../lib/api';
import { Icon } from './components/Icon';
import { useBacklogTasks, Task } from '../lib/hooks/useTasks';
import { useThemes, Theme } from '../lib/hooks/useThemes';
import { useRolloverStore } from '../lib/stores/rollover-store';

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

export default function CarryPull() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const setPendingRitualId = useRolloverStore((s) => s.setPendingRitualId);

  const { data: tasks, isLoading } = useBacklogTasks();
  const { data: themes } = useThemes();

  const [added, setAdded] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const themeMap = new Map<string, Theme>((themes ?? []).map((t) => [t.id, t]));

  function toggleTask(taskId: string) {
    setAdded((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  async function startWeek() {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Promote selected backlog tasks to this week
      await Promise.all(
        [...added].map((taskId) => api.post(`/tasks/${taskId}/promote`)),
      );
      // Invalidate task queries so This Week loads fresh
      await qc.invalidateQueries({ queryKey: ['tasks'] });
      // Clear the ritual — unblocks tabs
      setPendingRitualId(null);
      router.replace('/new-week');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Modal header */}
      <View style={styles.modalHead}>
        <Text style={styles.stepLabel}>SUNDAY SET-UP · 3 OF 3</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Stock this week</Text>
        <Text style={styles.sub}>
          Anything in your backlog you want to pull in? Optional — tap to add.{' '}
          {added.size > 0 && (
            <Text style={styles.addedCount}>{added.size} added.</Text>
          )}
        </Text>

        {isLoading && (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
        )}

        {(tasks ?? []).map((task: Task) => {
          const isAdded = added.has(task.id);
          const theme = themeMap.get(task.theme_id);
          return (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskRow, isAdded && styles.taskRowAdded]}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.8}
            >
              {/* Checkbox */}
              <View style={[styles.check, isAdded && styles.checkAdded]}>
                {isAdded ? (
                  <Icon name="check" size={13} color={colors.bg} />
                ) : (
                  <Icon name="plus" size={12} color={colors.text3} />
                )}
              </View>

              {/* Body */}
              <View style={styles.taskBody}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.chipRow}>
                  {theme && (
                    <View style={[styles.chip, { backgroundColor: `${theme.color ?? colors.text2}22` }]}>
                      <View style={[styles.chipDot, { backgroundColor: theme.color ?? colors.text2 }]} />
                      <Text style={[styles.chipText, { color: theme.color ?? colors.text2 }]}>{theme.name}</Text>
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
                </View>
              </View>

              {/* Added badge */}
              {isAdded && (
                <Text style={styles.addedBadge}>ADDED</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
          onPress={startWeek}
          disabled={submitting}
        >
          <Text style={styles.primaryBtnText}>Start week</Text>
        </TouchableOpacity>
        <Text style={styles.footnote}>
          You can always pull more from the Backlog tab any time.
        </Text>
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
  heading: {
    fontFamily: fonts.serif,
    fontSize: 24,
    fontWeight: '500',
    color: colors.text,
    marginTop: 8,
    marginBottom: 6,
    letterSpacing: -0.36,
  },
  sub: {
    fontSize: 14,
    color: colors.text2,
    lineHeight: 21,
    marginBottom: 22,
  },
  addedCount: {
    color: colors.sage,
    fontWeight: '600',
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
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 6,
    // Gradient-style fade
    backgroundColor: colors.bg,
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
  footnote: {
    fontSize: 11.5,
    color: colors.text3,
    textAlign: 'center',
  },
});
