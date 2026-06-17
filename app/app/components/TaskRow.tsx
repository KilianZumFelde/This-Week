import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius } from '../../lib/tokens';
import { Theme } from '../../lib/hooks/useThemes';
import { Icon } from './Icon';
import { TapFeedback } from './TapFeedback';

// ─── Theme chip ───────────────────────────────────────────────────────────────

export function ThemeChip({ theme }: { theme: Theme | undefined }) {
  if (!theme) return null;
  const color = theme.color ?? colors.text2;
  return (
    <View style={[styles.chip, { backgroundColor: `${color}22` }]}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={[styles.chipText, { color }]}>{theme.name}</Text>
    </View>
  );
}

// ─── Priority helpers ─────────────────────────────────────────────────────────

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

// ─── TaskRow ──────────────────────────────────────────────────────────────────

export type TaskRowProps = {
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
  onPressBody?: () => void;
};

export function TaskRow({ task, theme, onToggle, onPressBody }: TaskRowProps) {
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
      <TouchableOpacity
        style={styles.taskBody}
        onPress={onPressBody}
        activeOpacity={onPressBody ? 0.7 : 1}
        disabled={!onPressBody}
      >
        <Text style={[styles.taskTitle, done && styles.taskTitleDone]}>{task.title}</Text>
        <View style={styles.taskMeta}>
          <ThemeChip theme={theme} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
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
  },
});
