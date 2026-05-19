import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { colors, radius } from '../../lib/tokens';
import { Icon } from './Icon';
import { useGoals, useMarkGoalHit, useAbandonGoal, Goal } from '../../lib/hooks/useGoals';

function ActionRow({
  icon,
  label,
  sub,
  tone,
  onPress,
}: {
  icon: string;
  label: string;
  sub: string;
  tone: 'default' | 'sage' | 'brick' | 'accent';
  onPress: () => void;
}) {
  const labelColor = {
    default: colors.text,
    sage: colors.sage,
    brick: colors.brick,
    accent: colors.accentStrong,
  }[tone];

  const bg = {
    default: colors.surface2,
    sage: `rgba(142,160,118,0.18)`,
    brick: `rgba(168,107,94,0.18)`,
    accent: `rgba(200,120,86,0.18)`,
  }[tone];

  return (
    <TouchableOpacity style={[styles.actionRow, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.actionIcon}>
        <Icon name={icon} size={18} color={labelColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionLabel, { color: labelColor }]}>{label}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
      <Icon name="chevron-right" size={14} color={colors.text3} />
    </TouchableOpacity>
  );
}

export function OverdueGoalPrompt() {
  const router = useRouter();
  const { data: goals } = useGoals();
  const markHit = useMarkGoalHit();
  const abandon = useAbandonGoal();

  const [dismissed, setDismissed] = useState<string[]>([]);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // Find first overdue active goal that hasn't been dismissed this session
  const today = new Date().toISOString().slice(0, 10);
  const overdueGoal: Goal | undefined = (goals ?? []).find(
    (g) => g.status === 'active' && g.target_date < today && !dismissed.includes(g.id)
  );

  useEffect(() => {
    if (overdueGoal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [overdueGoal?.id]);

  function dismiss() {
    if (!overdueGoal) return;
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setDismissed((d) => [...d, overdueGoal.id]);
    });
  }

  function handleMarkHit() {
    if (!overdueGoal) return;
    markHit.mutate(overdueGoal.id);
    dismiss();
  }

  function handleExtend() {
    if (!overdueGoal) return;
    dismiss();
    router.push({ pathname: '/add-goal', params: { goalId: overdueGoal.id } });
  }

  function handleAbandon() {
    if (!overdueGoal) return;
    abandon.mutate(overdueGoal.id);
    dismiss();
  }

  if (!overdueGoal) return null;

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={dismiss} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.grip} />

        {/* Preview */}
        <View style={styles.preview}>
          <Text style={styles.previewEyebrow}>
            {overdueGoal.goal_type === 'primary' ? 'Primary goal' : 'Secondary goal'} · past target date
          </Text>
          <Text style={styles.previewTitle}>{overdueGoal.title}</Text>
          <Text style={styles.previewSub}>
            Target was {new Date(overdueGoal.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        <Text style={styles.question}>Did you reach this goal?</Text>

        <View style={styles.actions}>
          <ActionRow
            icon="check"
            label="Mark as hit"
            sub="Move to past goals — well done."
            tone="sage"
            onPress={handleMarkHit}
          />
          <ActionRow
            icon="calendar"
            label="Extend"
            sub="Reopen the form to push the target date."
            tone="accent"
            onPress={handleExtend}
          />
          <ActionRow
            icon="x"
            label="Abandon"
            sub="Move to past goals as abandoned."
            tone="brick"
            onPress={handleAbandon}
          />
        </View>

        <Text style={styles.footer}>Tap outside to dismiss for now.</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,18,16,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
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
  },
  preview: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  previewEyebrow: {
    fontSize: 10.5,
    letterSpacing: 1.5,
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
    lineHeight: 28,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  previewSub: {
    fontSize: 12.5,
    color: colors.text3,
  },
  question: {
    fontSize: 13,
    color: colors.text2,
    marginBottom: 12,
  },
  actions: {
    gap: 8,
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
    backgroundColor: colors.surface,
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
    lineHeight: 16,
  },
  footer: {
    fontSize: 11.5,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 16,
  },
});
