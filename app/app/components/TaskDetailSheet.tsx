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
import { Task, useUpdateTask, useDeleteTask, useCreateTask } from '../../lib/hooks/useTasks';
import { Theme } from '../../lib/hooks/useThemes';
import { useUndoStore } from '../../lib/stores/undo-store';

type EffortValue = Task['effort_level'];
type ReturnValue = Task['return_level'];
type WeekValue = Task['week_assignment'];
type FieldKey = 'theme' | 'effort' | 'return' | 'week';

// ─── Shared picker primitives ─────────────────────────────────────────────────

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
  sub,
  leading,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  sub?: string;
  leading?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.optionRadio, selected && styles.optionRadioOn]}>
        {selected && <Icon name="check" size={11} color="#1a1816" />}
      </View>
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelOn]}>{label}</Text>
        {sub ? <Text style={styles.optionSub}>{sub}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

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

// ─── TaskDetailSheet ──────────────────────────────────────────────────────────

type Props = {
  task: Task | null;
  themes: Theme[];
  onClose: () => void;
};

export function TaskDetailSheet({ task, themes, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const showUndo = useUndoStore((s) => s.show);

  const [title, setTitle] = useState('');
  const [themeId, setThemeId] = useState('');
  const [effort, setEffort] = useState<EffortValue>('unknown');
  const [returnLevel, setReturnLevel] = useState<ReturnValue>('unknown');
  const [week, setWeek] = useState<WeekValue>('this_week');
  const [openField, setOpenField] = useState<FieldKey | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setThemeId(task.theme_id);
      setEffort(task.effort_level);
      setReturnLevel(task.return_level);
      setWeek(task.week_assignment);
      setOpenField(null);
      setIsEditingTitle(false);
    }
  }, [task?.id]);

  function handleClose() {
    if (!task) return;
    const dirty =
      title.trim() !== task.title ||
      themeId !== task.theme_id ||
      effort !== task.effort_level ||
      returnLevel !== task.return_level ||
      week !== task.week_assignment;
    if (dirty && title.trim()) {
      updateTask.mutate({
        id: task.id,
        title: title.trim(),
        theme_id: themeId,
        effort_level: effort,
        return_level: returnLevel,
        week_assignment: week,
      });
    }
    onClose();
  }

  function handleDelete() {
    if (!task) return;
    const snap = { ...task };
    deleteTask.mutate(task.id);
    showUndo({
      label: `"${snap.title}" deleted`,
      undo: () =>
        createTask.mutate({
          theme_id: snap.theme_id,
          title: snap.title,
          effort_level: snap.effort_level,
          return_level: snap.return_level,
          week_assignment: snap.week_assignment,
        }),
    });
    onClose();
  }

  function handleMoveToBacklog() {
    if (!task) return;
    updateTask.mutate({ id: task.id, week_assignment: 'backlog' });
    onClose();
  }

  const toggle = (key: FieldKey) => setOpenField((o) => (o === key ? null : key));
  const activeTheme = themes.find((t) => t.id === themeId);

  const FIELDS: FieldKey[] = ['theme', 'effort', 'return', 'week'];
  const openIdx = openField ? FIELDS.indexOf(openField) : -1;
  const above = openIdx === -1 ? FIELDS : FIELDS.slice(0, openIdx + 1);
  const below = openIdx === -1 ? [] : FIELDS.slice(openIdx + 1);

  function renderChip(key: FieldKey) {
    if (key === 'theme') {
      return (
        <DetailChip
          key="theme"
          label="Theme"
          value={activeTheme?.name ?? '—'}
          isOpen={openField === 'theme'}
          onPress={() => toggle('theme')}
        />
      );
    }
    if (key === 'effort') {
      const label = effort === 'unknown' ? 'set effort' : effort;
      return (
        <DetailChip
          key="effort"
          label="Effort"
          value={label}
          isOpen={openField === 'effort'}
          onPress={() => toggle('effort')}
        />
      );
    }
    if (key === 'return') {
      const label = returnLevel === 'unknown' ? 'set return' : returnLevel;
      return (
        <DetailChip
          key="return"
          label="Return"
          value={label}
          isOpen={openField === 'return'}
          onPress={() => toggle('return')}
        />
      );
    }
    if (key === 'week') {
      return (
        <DetailChip
          key="week"
          label="Week"
          value={week === 'this_week' ? 'this week' : 'backlog'}
          isOpen={openField === 'week'}
          onPress={() => toggle('week')}
        />
      );
    }
    return null;
  }

  function renderPicker() {
    if (!openField) return null;
    if (openField === 'theme') {
      return (
        <PickerCard title="Theme">
          {themes.map((t) => (
            <OptionRow
              key={t.id}
              selected={t.id === themeId}
              onPress={() => { setThemeId(t.id); setOpenField(null); }}
              label={t.name}
              leading={
                <View style={[styles.themeDot, { backgroundColor: t.color ?? colors.text3 }]} />
              }
            />
          ))}
        </PickerCard>
      );
    }
    if (openField === 'effort') {
      const OPTIONS = [
        { v: 'low' as EffortValue, l: 'Low', s: 'Under ~30 min, no setup' },
        { v: 'medium' as EffortValue, l: 'Medium', s: 'A focused hour or so' },
        { v: 'high' as EffortValue, l: 'High', s: 'Half-day or more, real activation cost' },
      ];
      return (
        <PickerCard title="Effort · how heavy is this lift?">
          {OPTIONS.map((o) => (
            <OptionRow
              key={o.v}
              selected={effort === o.v}
              onPress={() => { setEffort(o.v); setOpenField(null); }}
              label={o.l}
              sub={o.s}
            />
          ))}
        </PickerCard>
      );
    }
    if (openField === 'return') {
      const OPTIONS = [
        { v: 'low' as ReturnValue, l: 'Low', s: 'Nice-to-have' },
        { v: 'medium' as ReturnValue, l: 'Medium', s: 'Useful, not pivotal' },
        { v: 'high' as ReturnValue, l: 'High', s: 'Unlocks something material' },
      ];
      return (
        <PickerCard title="Return · how much will this move the goal?">
          {OPTIONS.map((o) => (
            <OptionRow
              key={o.v}
              selected={returnLevel === o.v}
              onPress={() => { setReturnLevel(o.v); setOpenField(null); }}
              label={o.l}
              sub={o.s}
            />
          ))}
        </PickerCard>
      );
    }
    if (openField === 'week') {
      const OPTIONS = [
        { v: 'this_week' as WeekValue, l: 'This week', s: "You're committing now" },
        { v: 'backlog' as WeekValue, l: 'Backlog', s: 'For later — surfaces in Sunday set-up' },
      ];
      return (
        <PickerCard title="Where does this live?">
          {OPTIONS.map((o) => (
            <OptionRow
              key={o.v}
              selected={week === o.v}
              onPress={() => { setWeek(o.v); setOpenField(null); }}
              label={o.l}
              sub={o.s}
            />
          ))}
        </PickerCard>
      );
    }
    return null;
  }

  return (
    <Modal
      visible={task !== null}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Scrim */}
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={handleClose} />

        {/* Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(28, insets.bottom) }]}>
            {/* Grip */}
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
                  <Text style={styles.titleText}>{task?.title ?? ''}</Text>
                )}
                <View style={{ marginTop: 6 }}>
                  <Icon name="chevDown" size={16} color={colors.text3} />
                </View>
              </TouchableOpacity>

              {/* Details label */}
              <Text style={styles.sectionLabel}>Details</Text>

              {/* Chips above picker */}
              <View style={styles.chipsRow}>
                {above.map(renderChip)}
              </View>

              {/* Inline picker */}
              {renderPicker()}

              {/* Chips below picker */}
              {below.length > 0 && (
                <View style={[styles.chipsRow, { marginTop: 12 }]}>
                  {below.map(renderChip)}
                </View>
              )}

              {/* Reminder row */}
              <View style={styles.reminderRow}>
                <Icon name="bell" size={16} color={colors.text2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderText}>No reminder set</Text>
                  <Text style={styles.reminderSub}>Tap to add one</Text>
                </View>
                <Text style={styles.reminderEdit}>EDIT</Text>
              </View>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnGhost]}
                  onPress={handleMoveToBacklog}
                  activeOpacity={0.7}
                >
                  <Icon name="inbox" size={15} color={colors.text} />
                  <Text style={styles.actionBtnText}>Move to backlog</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnGhost]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Icon name="x" size={15} color={colors.brick} />
                  <Text style={[styles.actionBtnText, { color: colors.brick }]}>Delete</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.footerNote}>
                Accidental? An Undo snackbar appears for ~6s after any remove.
              </Text>
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
  sheetWrapper: {
    // Wraps sheet for keyboard avoidance
  },
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
  // Title
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
    fontSize: 22,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 28,
    letterSpacing: -0.22,
  },
  titleInput: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  // Section label
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 10,
  },
  // Chips
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
  // Picker card
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
  },
  optionLabelOn: {
    fontWeight: '500',
  },
  optionSub: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 1,
  },
  // Reminder
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    marginTop: 18,
    marginBottom: 22,
  },
  reminderText: {
    fontSize: 13,
    color: colors.text,
  },
  reminderSub: {
    fontSize: 11.5,
    color: colors.text3,
    marginTop: 1,
  },
  reminderEdit: {
    fontSize: 11,
    color: colors.accentStrong,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '600',
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
  footerNote: {
    fontSize: 11.5,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 17,
    paddingBottom: 4,
  },
});
