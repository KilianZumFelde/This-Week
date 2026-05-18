import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../lib/tokens';
import { Icon } from './components/Icon';
import { useThemes } from '../lib/hooks/useThemes';
import { useCreateGoal, useUpdateGoal, useGoals } from '../lib/hooks/useGoals';

type DatePreset = '3mo' | '6mo' | '1y' | null;

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function addYear(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function presetToDate(preset: DatePreset): string | null {
  if (!preset) return null;
  if (preset === '3mo') return addMonths(3);
  if (preset === '6mo') return addMonths(6);
  if (preset === '1y') return addYear();
  return null;
}

function formatDateDisplay(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AddGoal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ goalId?: string }>();
  const { data: themes } = useThemes();
  const { data: goals } = useGoals();

  const editGoal = params.goalId ? goals?.find((g) => g.id === params.goalId) : undefined;

  const [title, setTitle] = useState(editGoal?.title ?? '');
  const [why, setWhy] = useState(editGoal?.why ?? '');
  const [type, setType] = useState<'primary' | 'secondary'>(editGoal?.goal_type ?? 'primary');
  const [themeId, setThemeId] = useState<string | null>(editGoal?.theme_id ?? null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>(null);
  const [targetDate, setTargetDate] = useState<string | null>(editGoal?.target_date ?? null);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const isSubmitting = createGoal.isPending || updateGoal.isPending;

  const canSave = title.trim().length > 0 && !!targetDate;

  const selectedTheme = themes?.find((t) => t.id === themeId);

  function handleDatePreset(preset: DatePreset) {
    setDatePreset(preset);
    if (preset && preset !== null) {
      const d = presetToDate(preset);
      if (d) setTargetDate(d);
    }
  }

  async function handleSave() {
    if (!canSave || isSubmitting) return;

    const body = {
      title: title.trim(),
      why: why.trim() || null,
      goal_type: type,
      target_date: targetDate!,
      theme_id: themeId,
    };

    if (editGoal) {
      updateGoal.mutate({ id: editGoal.id, ...body }, { onSuccess: () => router.back() });
    } else {
      createGoal.mutate(body, { onSuccess: () => router.back() });
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.page, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.modalHead, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Icon name="x" size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{editGoal ? 'Edit goal' : 'New goal'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave || isSubmitting} style={styles.saveBtn}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.accentStrong} />
          ) : (
            <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Goal</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What are you working toward?"
            placeholderTextColor={colors.text3}
            style={styles.titleInput}
            multiline
            autoFocus={!editGoal}
          />
        </View>

        {/* Target date */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Target date</Text>
            {!targetDate && (
              <Text style={styles.requiredBadge}>Required</Text>
            )}
          </View>
          <View style={styles.dateChips}>
            {([
              { v: '3mo' as DatePreset, l: '3 months' },
              { v: '6mo' as DatePreset, l: '6 months' },
              { v: '1y' as DatePreset, l: '1 year' },
            ] as const).map((o) => {
              const on = datePreset === o.v;
              return (
                <TouchableOpacity
                  key={o.v}
                  onPress={() => handleDatePreset(o.v)}
                  style={[styles.dateChip, on && styles.dateChipOn]}
                >
                  <Text style={[styles.dateChipText, on && styles.dateChipTextOn]}>{o.l}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {targetDate && (
            <View style={styles.dateDisplay}>
              <Icon name="calendar" size={16} color={colors.text2} />
              <Text style={styles.dateDisplayText}>{formatDateDisplay(targetDate)}</Text>
              <Text style={styles.dateDisplayHint}>tap to refine</Text>
            </View>
          )}
        </View>

        {/* Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Type</Text>
          {([
            { v: 'primary' as const, l: 'Primary', s: 'Your headline goal. One at a time.' },
            { v: 'secondary' as const, l: 'Secondary', s: 'Side priority. Up to two of these.' },
          ] as const).map((o) => {
            const on = type === o.v;
            return (
              <TouchableOpacity
                key={o.v}
                onPress={() => setType(o.v)}
                style={[styles.typeCard, on && styles.typeCardOn]}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, on && styles.radioOuterOn]}>
                  {on && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.typeLabel}>{o.l}</Text>
                  <Text style={styles.typeSub}>{o.s}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Theme</Text>
          <TouchableOpacity
            style={[styles.themeRow, themeOpen && styles.themeRowOpen]}
            onPress={() => setThemeOpen((o) => !o)}
            activeOpacity={0.7}
          >
            {selectedTheme ? (
              <>
                <View style={[styles.themeDot, { backgroundColor: selectedTheme.color ?? colors.text3 }]} />
                <Text style={styles.themeRowText}>{selectedTheme.name}</Text>
              </>
            ) : (
              <Text style={styles.themeRowPlaceholder}>Pick a theme</Text>
            )}
            <Icon name={themeOpen ? 'chevron-down' : 'chevron-right'} size={14} color={colors.text3} />
          </TouchableOpacity>
          {themeOpen && (
            <View style={styles.themeList}>
              <TouchableOpacity
                style={styles.themeListItem}
                onPress={() => { setThemeId(null); setThemeOpen(false); }}
                activeOpacity={0.7}
              >
                <View style={[styles.themeDot, { backgroundColor: colors.text3 }]} />
                <Text style={[styles.themeListText, { color: colors.text3 }]}>None</Text>
                {!themeId && <Icon name="check" size={14} color={colors.accentStrong} />}
              </TouchableOpacity>
              {(themes ?? []).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.themeListItem}
                  onPress={() => { setThemeId(t.id); setThemeOpen(false); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.themeDot, { backgroundColor: t.color ?? colors.text3 }]} />
                  <Text style={styles.themeListText}>{t.name}</Text>
                  {themeId === t.id && <Icon name="check" size={14} color={colors.accentStrong} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Why */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Why does this matter?</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
          </View>
          <TextInput
            value={why}
            onChangeText={setWhy}
            placeholder="In your own words. Read this back on a rough week."
            placeholderTextColor={colors.text3}
            style={styles.whyInput}
            multiline
            numberOfLines={3}
          />
        </View>

        {!canSave && title.trim().length > 0 && (
          <Text style={styles.requiredHint}>Title + target date are required.</Text>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 22) }]}>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => router.back()}>
          <Text style={styles.btnGhostText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, { flex: 1.6, opacity: canSave ? 1 : 0.45 }]}
          onPress={handleSave}
          disabled={!canSave || isSubmitting}
        >
          <Text style={styles.btnPrimaryText}>Save goal</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'Georgia',
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
  },
  saveBtn: {
    paddingHorizontal: 6,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentStrong,
    letterSpacing: 0.1,
  },
  saveBtnTextDisabled: {
    color: colors.text3,
  },
  body: {
    padding: 20,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 26,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 10,
  },
  requiredBadge: {
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.accentStrong,
    fontWeight: '600',
  },
  optionalBadge: {
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
  },
  titleInput: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 30,
    letterSpacing: -0.24,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    backgroundColor: 'transparent',
  },
  dateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dateChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  dateChipOn: {
    backgroundColor: colors.accent,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  dateChipTextOn: {
    color: '#1a1816',
    fontWeight: '600',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
  },
  dateDisplayText: {
    fontSize: 14,
    color: colors.text,
  },
  dateDisplayHint: {
    marginLeft: 'auto',
    fontSize: 11.5,
    color: colors.text3,
    letterSpacing: 0.4,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  typeCardOn: {
    backgroundColor: 'rgba(200,120,86,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(200,120,86,0.25)',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.text3,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioOuterOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  radioInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1a1816',
  },
  typeLabel: {
    fontSize: 14.5,
    color: colors.text,
    fontWeight: '500',
  },
  typeSub: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
    lineHeight: 17,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  themeRowOpen: {
    backgroundColor: 'rgba(200,120,86,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(200,120,86,0.20)',
  },
  themeDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    flexShrink: 0,
  },
  themeRowText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  themeRowPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: colors.text3,
  },
  themeList: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  themeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  themeListText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  whyInput: {
    backgroundColor: colors.surface,
    fontSize: 13.5,
    color: colors.text,
    lineHeight: 21,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  requiredHint: {
    fontSize: 11.5,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.hairline2,
  },
  btnGhostText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1816',
  },
});
