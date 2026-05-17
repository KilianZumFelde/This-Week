import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../lib/tokens';
import { Icon } from './Icon';
import { Habit, HabitWeekRecord, useUpdateHabit, useDeleteHabit, useCreateHabit } from '../../lib/hooks/useHabits';
import { Theme } from '../../lib/hooks/useThemes';
import { useUndoStore } from '../../lib/stores/undo-store';

// ─── Picker primitives ────────────────────────────────────────────────────────

function PickerCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.pickerCard}>
      <Text style={styles.pickerTitle}>{title}</Text>
      {children}
    </View>
  );
}

function OptionRow({
  selected,
  onPress,
  label,
  leading,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  leading?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.optionRadio, selected && styles.optionRadioOn]}>
        {selected && <Icon name="check" size={11} color="#1a1816" />}
      </View>
      {leading}
      <Text style={[styles.optionLabel, selected && styles.optionLabelOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DetailChip({
  label,
  value,
  isOpen,
  onPress,
}: {
  label: string;
  value: string;
  isOpen: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, isOpen && styles.chipOpen]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipKey, isOpen && styles.chipKeyOpen]}>{label}</Text>
      <Text style={[styles.chipValue, isOpen && { color: colors.text }]}>{value}</Text>
      <Icon name={isOpen ? 'chevDown' : 'chevron-right'} size={11} color={colors.text3} />
    </TouchableOpacity>
  );
}

// ─── HabitDetailSheet ─────────────────────────────────────────────────────────

type Props = {
  habit: Habit | null;
  weekRecord: HabitWeekRecord | undefined;
  themes: Theme[];
  onClose: () => void;
};

export function HabitDetailSheet({ habit, weekRecord, themes, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const createHabit = useCreateHabit();
  const showUndo = useUndoStore((s) => s.show);

  const [title, setTitle] = useState('');
  const [themeId, setThemeId] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setThemeId(habit.theme_id);
      setWeeklyTarget(habit.weekly_target);
      setThemePickerOpen(false);
      setIsEditingTitle(false);
    }
  }, [habit?.id]);

  function handleClose() {
    if (!habit) return;
    const dirty =
      title.trim() !== habit.title ||
      themeId !== habit.theme_id ||
      weeklyTarget !== habit.weekly_target;
    if (dirty && title.trim()) {
      updateHabit.mutate({
        id: habit.id,
        title: title.trim(),
        theme_id: themeId,
        weekly_target: weeklyTarget,
      });
    }
    onClose();
  }

  function handlePause() {
    if (!habit) return;
    updateHabit.mutate({ id: habit.id, status: 'paused' });
    onClose();
  }

  function handleDelete() {
    if (!habit) return;
    const snap = { ...habit };
    deleteHabit.mutate(habit.id);
    showUndo({
      label: `"${snap.title}" deleted`,
      undo: () =>
        createHabit.mutate({
          theme_id: snap.theme_id,
          title: snap.title,
          weekly_target: snap.weekly_target,
        }),
    });
    onClose();
  }

  const activeTheme = themes.find((t) => t.id === themeId);
  const currentStreak = habit?.current_streak ?? 0;
  const bestStreak = habit?.best_streak ?? 0;

  // 8-week dot row: right-most = this week
  const currentWeekHit = weekRecord?.target_met ?? false;
  const dots = Array.from({ length: 8 }, (_, i) => {
    const weeksAgo = 7 - i;
    if (weeksAgo === 0) return currentWeekHit;
    return weeksAgo <= currentStreak;
  });

  return (
    <Modal
      visible={habit !== null}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(28, insets.bottom) }]}>
            <View style={styles.grip} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Editable title */}
              <TouchableOpacity
                style={styles.titleRow}
                onPress={() => setIsEditingTitle(true)}
                activeOpacity={0.8}
              >
                {isEditingTitle ? (
                  <TextInput
                    style={[styles.titleText, styles.titleInput]}
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                    multiline
                    onBlur={() => setIsEditingTitle(false)}
                    returnKeyType="done"
                  />
                ) : (
                  <Text style={styles.titleText}>{habit?.title ?? ''}</Text>
                )}
                <Icon name="chevDown" size={16} color={colors.text3} />
              </TouchableOpacity>

              {/* Theme chip */}
              <View style={styles.chipsRow}>
                <DetailChip
                  label="Theme"
                  value={activeTheme?.name ?? '—'}
                  isOpen={themePickerOpen}
                  onPress={() => setThemePickerOpen((o) => !o)}
                />
                <View style={[styles.chip, { borderWidth: 0 }]}>
                  <Text style={[styles.chipKey]}>Goal</Text>
                  <Text style={[styles.chipValue, { fontStyle: 'italic', color: colors.text3 }]}>
                    none — link one?
                  </Text>
                </View>
              </View>

              {themePickerOpen && (
                <PickerCard title="Theme">
                  {themes.map((t) => (
                    <OptionRow
                      key={t.id}
                      selected={t.id === themeId}
                      onPress={() => { setThemeId(t.id); setThemePickerOpen(false); }}
                      label={t.name}
                      leading={
                        <View style={[styles.themeDot, { backgroundColor: t.color ?? colors.text3 }]} />
                      }
                    />
                  ))}
                </PickerCard>
              )}

              {/* Weekly target stepper */}
              <View style={styles.stepperRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepperLabel}>Weekly target</Text>
                  <Text style={styles.stepperSub}>Hit this = on-target for the week</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setWeeklyTarget((n) => Math.max(1, n - 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <View style={styles.stepperCountWrap}>
                    <Text style={styles.stepperCount}>{weeklyTarget}</Text>
                    <Text style={styles.stepperCountSuffix}>×</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setWeeklyTarget((n) => Math.min(14, n + 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Streak block */}
              <View style={styles.streakBlock}>
                <View style={styles.streakLabelRow}>
                  <Icon name="flame" size={12} color={colors.gold} />
                  <Text style={styles.streakLabelText}>Streak</Text>
                </View>
                <View style={styles.streakNumbers}>
                  <View style={styles.streakStat}>
                    <View style={styles.streakCurrentRow}>
                      <Text style={styles.streakCurrentNum}>{currentStreak}</Text>
                      <Text style={styles.streakWkSuffix}>wk</Text>
                    </View>
                    <Text style={styles.streakStatLabel}>Current</Text>
                  </View>
                  <View style={styles.streakStat}>
                    <View style={styles.streakCurrentRow}>
                      <Text style={styles.streakBestNum}>{bestStreak}</Text>
                      <Text style={[styles.streakWkSuffix, { fontSize: 13 }]}>wk</Text>
                    </View>
                    <Text style={styles.streakStatLabel}>Best</Text>
                  </View>
                </View>

                {/* 8-week dot row */}
                <View style={styles.dotRow}>
                  {dots.map((hit, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: hit ? colors.gold : colors.surfaceHi,
                          opacity: hit && i === 7 ? 1 : hit ? 0.7 : 1,
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.dotLabels}>
                  <Text style={styles.dotLabel}>8 wk ago</Text>
                  <Text style={styles.dotLabel}>this week</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnGhost]}
                  onPress={handlePause}
                  activeOpacity={0.7}
                >
                  <Icon name="pause" size={13} color={colors.text} />
                  <Text style={styles.actionBtnText}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnGhost]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Icon name="x" size={13} color={colors.brick} />
                  <Text style={[styles.actionBtnText, { color: colors.brick }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,18,16,0.55)',
  },
  sheetWrapper: {},
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 16,
    maxHeight: '90%',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    marginBottom: 18,
    gap: 8,
  },
  titleText: {
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 30,
    letterSpacing: -0.24,
  },
  titleInput: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
  },
  chipOpen: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  chipKey: {
    fontSize: 11.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: colors.text3,
    marginRight: 4,
  },
  chipKeyOpen: {
    color: colors.accentStrong,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  themeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  pickerCard: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentDim,
    padding: 14,
    paddingBottom: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  pickerTitle: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accentStrong,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  optionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.text3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionRadioOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '400',
    flex: 1,
  },
  optionLabelOn: {
    fontWeight: '500',
  },
  // Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    marginTop: 18,
    marginBottom: 14,
  },
  stepperLabel: {
    fontSize: 13.5,
    color: colors.text,
    fontWeight: '500',
  },
  stepperSub: {
    fontSize: 11.5,
    color: colors.text3,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '400',
    lineHeight: 22,
  },
  stepperCountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 44,
    justifyContent: 'center',
  },
  stepperCount: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '500',
    color: colors.text,
  },
  stepperCountSuffix: {
    fontSize: 13,
    color: colors.text3,
    marginLeft: 1,
  },
  // Streak block
  streakBlock: {
    padding: 16,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    marginBottom: 18,
  },
  streakLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  streakLabelText: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.gold,
    fontWeight: '600',
  },
  streakNumbers: {
    flexDirection: 'row',
    gap: 28,
    marginBottom: 16,
  },
  streakStat: {
    gap: 2,
  },
  streakCurrentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  streakCurrentNum: {
    fontFamily: 'Georgia',
    fontSize: 38,
    fontWeight: '400',
    letterSpacing: -0.76,
    color: colors.gold,
    lineHeight: 42,
  },
  streakBestNum: {
    fontFamily: 'Georgia',
    fontSize: 22,
    color: colors.text,
    lineHeight: 26,
  },
  streakWkSuffix: {
    fontSize: 16,
    color: colors.text2,
  },
  streakStatLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.text3,
    letterSpacing: 0.5,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  dotLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dotLabel: {
    fontSize: 10.5,
    color: colors.text3,
  },
  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: radius.md,
  },
  actionBtnGhost: {
    borderWidth: 1,
    borderColor: colors.hairline2,
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.text,
  },
});
