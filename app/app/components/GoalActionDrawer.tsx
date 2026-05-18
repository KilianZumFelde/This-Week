import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../lib/tokens';
import { Icon } from './Icon';
import { Goal, useMarkGoalHit, useAbandonGoal } from '../../lib/hooks/useGoals';
import { Theme } from '../../lib/hooks/useThemes';

type Tone = 'default' | 'sage' | 'brick' | 'accent';

const TONE_COLOR: Record<Tone, string> = {
  default: colors.text,
  sage: colors.sage,
  brick: colors.brick,
  accent: colors.accentStrong,
};

const TONE_BG: Record<Tone, string> = {
  default: colors.surface2,
  sage: 'rgba(142,160,118,0.20)',
  brick: 'rgba(168,107,94,0.20)',
  accent: 'rgba(200,120,86,0.20)',
};

function ActionRow({
  icon,
  label,
  sub,
  tone = 'default',
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  tone?: Tone;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, { backgroundColor: TONE_BG[tone] }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: colors.surface }]}>
        <Icon name={icon} size={17} color={TONE_COLOR[tone]} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.actionLabel, { color: TONE_COLOR[tone] }]}>{label}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
      <Icon name="chevron-right" size={14} color={colors.text3} />
    </TouchableOpacity>
  );
}

type Props = {
  goal: Goal | null;
  themes: Theme[];
  onClose: () => void;
  onEdit?: (goal: Goal) => void;
};

export function GoalActionDrawer({ goal, themes, onClose, onEdit }: Props) {
  const insets = useSafeAreaInsets();
  const markHit = useMarkGoalHit();
  const abandon = useAbandonGoal();

  if (!goal) return null;

  const theme = themes.find((t) => t.id === goal.theme_id);
  const isActive = goal.status === 'active';

  const typeLabel = isActive
    ? goal.goal_type === 'primary' ? 'Primary goal' : 'Secondary goal'
    : goal.status === 'completed' ? 'Past goal · hit' : 'Past goal · abandoned';

  const formattedDate = new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <Modal
      visible={!!goal}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.grip} />

          {/* Goal preview */}
          <View style={styles.preview}>
            <Text style={styles.previewType}>{typeLabel}</Text>
            <Text style={styles.previewTitle}>{goal.title}</Text>
            <View style={styles.chipRow}>
              {theme && (
                <View style={[styles.chip, { backgroundColor: `${theme.color ?? colors.text3}22` }]}>
                  <View style={[styles.chipDot, { backgroundColor: theme.color ?? colors.text3 }]} />
                  <Text style={[styles.chipText, { color: theme.color ?? colors.text3 }]}>
                    {theme.name}
                  </Text>
                </View>
              )}
              <View style={styles.chip}>
                <Icon name="calendar" size={11} color={colors.text2} />
                <Text style={styles.chipText}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={{ gap: 8 }}>
            {isActive ? (
              <>
                <ActionRow
                  icon="check"
                  tone="sage"
                  label="Mark as hit"
                  sub="Move to past goals · keep all the tied tasks for posterity"
                  onPress={() => {
                    markHit.mutate(goal.id, { onSuccess: onClose });
                  }}
                />
                <ActionRow
                  icon="settings"
                  tone="default"
                  label="Edit"
                  sub="Reopen the goal form to refine title, date, theme, or why"
                  onPress={() => {
                    onClose();
                    onEdit?.(goal);
                  }}
                />
                <ActionRow
                  icon="x"
                  tone="brick"
                  label="Delete"
                  sub="Send to past goals as abandoned · tied tasks stay where they are"
                  onPress={() => {
                    abandon.mutate(goal.id, { onSuccess: onClose });
                  }}
                />
              </>
            ) : (
              <ActionRow
                icon="refresh"
                tone="accent"
                label="Reactivate"
                sub="Reopen the goal form to rethink it · subject to the 1+2 cap"
                onPress={() => {
                  onClose();
                  onEdit?.(goal);
                }}
              />
            )}
          </View>

          <Text style={styles.footer}>Pull down to dismiss.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,18,16,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
  },
  grip: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text3,
    opacity: 0.35,
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  preview: {
    paddingHorizontal: 4,
    paddingBottom: 16,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  previewType: {
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.accentStrong,
    fontWeight: '600',
    marginBottom: 6,
  },
  previewTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 27.5,
    letterSpacing: -0.22,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.surface2,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.text2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionLabel: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  actionSub: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
    lineHeight: 17,
  },
  footer: {
    fontSize: 11.5,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 17,
  },
});
