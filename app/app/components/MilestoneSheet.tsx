import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../lib/tokens';
import { Icon } from './Icon';
import { useCreateMilestone, useUpdateMilestone, useDeleteMilestone, useMilestones } from '../../lib/hooks/useMilestones';

// Resolve a relative chip to an ISO date string (YYYY-MM-DD)
export function resolveChip(chip: string): string {
  const d = new Date();
  if (chip === '1w') d.setDate(d.getDate() + 7);
  else if (chip === '2w') d.setDate(d.getDate() + 14);
  else if (chip === '3w') d.setDate(d.getDate() + 21);
  else if (chip === '1m') d.setMonth(d.getMonth() + 1);
  else if (chip === '5w') d.setDate(d.getDate() + 35);
  else if (chip === '6w') d.setDate(d.getDate() + 42);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const DATE_CHIPS: { key: string; label: string }[] = [
  { key: '1w', label: '1 week' },
  { key: '2w', label: '2 weeks' },
  { key: '3w', label: '3 weeks' },
  { key: '1m', label: '1 month' },
  { key: '5w', label: '5 weeks' },
  { key: '6w', label: '6 weeks' },
];

type Props = {
  visible: boolean;
  goalId: string;
  goalTargetDate: string;
  milestoneId: string | null;
  onClose: () => void;
};

export function MilestoneSheet({ visible, goalId, goalTargetDate, milestoneId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const isEditing = !!milestoneId;

  const { data: milestones } = useMilestones(goalId);
  const createMilestone = useCreateMilestone(goalId);
  const updateMilestone = useUpdateMilestone(goalId);
  const deleteMilestone = useDeleteMilestone(goalId);

  const [title, setTitle] = useState('');
  const [chip, setChip] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (isEditing && milestones) {
      const m = milestones.find((m) => m.id === milestoneId);
      if (m) {
        setTitle(m.title);
        setChip(null);
      }
    } else {
      setTitle('');
      setChip(null);
    }
    setDateError(null);
    setSaving(false);
  }, [visible, milestoneId]);

  const resolvedDate = chip ? resolveChip(chip) : null;

  // Inline validation: resolved date vs goal target date
  const afterGoal = resolvedDate ? resolvedDate > goalTargetDate : false;
  const goalDateStr = formatDisplayDate(goalTargetDate);

  const canSave = title.trim().length > 0 && resolvedDate !== null && !afterGoal && !saving;

  function handleSave() {
    if (!resolvedDate) return;
    setSaving(true);

    function onError(err: unknown) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      Alert.alert('Could not save', msg);
    }

    if (isEditing && milestoneId) {
      updateMilestone.mutate(
        { id: milestoneId, title: title.trim(), target_date: resolvedDate },
        { onSuccess: () => { setSaving(false); onClose(); }, onError },
      );
    } else {
      createMilestone.mutate(
        { title: title.trim(), target_date: resolvedDate },
        { onSuccess: () => { setSaving(false); onClose(); }, onError },
      );
    }
  }

  function handleDelete() {
    if (!milestoneId) return;
    Alert.alert(
      'Delete milestone?',
      'This removes it permanently. Tasks linked to the goal are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMilestone.mutate(milestoneId, {
              onSuccess: () => onClose(),
              onError: (err) => {
                const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
                Alert.alert('Could not delete', msg);
              },
            }),
        },
      ],
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.grip} />

          <Text style={styles.sheetTitle}>{isEditing ? 'Edit milestone' : 'New milestone'}</Text>

          {/* Title input */}
          <Text style={styles.fieldLabel}>Milestone</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="A near-term step toward the goal"
            placeholderTextColor={colors.text3}
            autoFocus={!isEditing}
            returnKeyType="done"
          />

          {/* Date chip row */}
          <Text style={styles.fieldLabel}>Target date</Text>
          <View style={styles.chipRow}>
            {DATE_CHIPS.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.dateChip, chip === c.key && styles.dateChipOn]}
                onPress={() => setChip(c.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateChipText, chip === c.key && styles.dateChipTextOn]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Resolved date pill */}
          {resolvedDate && (
            <View style={[styles.datePill, afterGoal && styles.datePillError]}>
              <Icon name="calendar" size={16} color={colors.text2} />
              <Text style={styles.datePillText}>{formatDisplayDate(resolvedDate)}</Text>
              <Text style={styles.datePillCap}>on or before {goalDateStr}</Text>
            </View>
          )}
          {afterGoal && (
            <Text style={styles.errorHint}>Must be on or before the goal's date ({goalDateStr}).</Text>
          )}

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, !canSave && styles.btnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>Save milestone</Text>
            </TouchableOpacity>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              disabled={deleteMilestone.isPending}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteBtnText}>Delete milestone</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
  sheetTitle: {
    fontFamily: 'Georgia',
    fontSize: 19,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 22,
    paddingHorizontal: 2,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    color: colors.text,
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.2,
    paddingVertical: 0,
    paddingBottom: 10,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dateChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateChipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  dateChipText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.text2,
  },
  dateChipTextOn: {
    color: colors.accentStrong,
    fontWeight: '600',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    paddingHorizontal: 14,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    marginBottom: 6,
  },
  datePillError: {
    borderWidth: 1,
    borderColor: colors.brick,
  },
  datePillText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  datePillCap: {
    fontSize: 11,
    color: colors.text3,
  },
  errorHint: {
    fontSize: 12,
    color: colors.brick,
    marginBottom: 4,
    marginLeft: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: radius.md,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.hairline2,
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  btnPrimary: {
    flex: 1.4,
    backgroundColor: colors.accent,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1816',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.brick,
  },
});
