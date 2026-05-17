import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../lib/tokens';
import { Icon } from './components/Icon';
import { useThemes, Theme } from '../lib/hooks/useThemes';
import { useCreateTask } from '../lib/hooks/useTasks';
import { useCreateHabit } from '../lib/hooks/useHabits';

// ─── Shared picker infrastructure ────────────────────────────────────────────

type PickerContainerProps = {
  title: string;
  hint?: string;
  children: React.ReactNode;
};

function PickerContainer({ title, hint, children }: PickerContainerProps) {
  return (
    <View style={styles.pickerCard}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>{title}</Text>
        {hint ? <Text style={styles.pickerHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

type OptionRowProps = {
  selected: boolean;
  onPress: () => void;
  label: string;
  sub?: string;
  leading?: React.ReactNode;
};

function OptionRow({ selected, onPress, label, sub, leading }: OptionRowProps) {
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

// ─── QA Chip ─────────────────────────────────────────────────────────────────

type ChipProps = {
  label: string;
  value: React.ReactNode;
  isOpen: boolean;
  locked?: boolean;
  onPress: () => void;
};

function QAChip({ label, value, isOpen, locked, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.qaChip, isOpen && styles.qaChipOpen]}
      onPress={locked ? undefined : onPress}
      activeOpacity={locked ? 1 : 0.7}
    >
      <Text style={[styles.qaChipKey, isOpen && styles.qaChipKeyOpen]}>{label}</Text>
      <Text style={[styles.qaChipValue, isOpen && { color: colors.text }]}>{value as string}</Text>
      {!locked && (
        <Icon name={isOpen ? 'chevDown' : 'chevron-right'} size={11} color={colors.text3} />
      )}
    </TouchableOpacity>
  );
}

// ─── Theme picker ─────────────────────────────────────────────────────────────

type ThemePickerProps = {
  themes: Theme[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function ThemePicker({ themes, selectedId, onSelect }: ThemePickerProps) {
  return (
    <PickerContainer title="Theme" hint="Tap to change">
      {themes.map((t) => (
        <OptionRow
          key={t.id}
          selected={t.id === selectedId}
          onPress={() => onSelect(t.id)}
          label={t.name}
          leading={
            <View style={[styles.themeDot, { backgroundColor: t.color ?? colors.text3 }]} />
          }
        />
      ))}
    </PickerContainer>
  );
}

// ─── Effort picker ────────────────────────────────────────────────────────────

const EFFORT_OPTIONS = [
  { v: 'low', l: 'Low', s: 'Under ~30 min, no setup' },
  { v: 'medium', l: 'Medium', s: 'A focused hour or so' },
  { v: 'high', l: 'High', s: 'Half-day or more, real activation cost' },
] as const;

type EffortValue = 'low' | 'medium' | 'high' | 'unknown';

function EffortPicker({ value, onSelect }: { value: EffortValue; onSelect: (v: EffortValue) => void }) {
  return (
    <PickerContainer title="Effort · how heavy is this lift?">
      {EFFORT_OPTIONS.map((o) => (
        <OptionRow
          key={o.v}
          selected={value === o.v}
          onPress={() => onSelect(o.v)}
          label={o.l}
          sub={o.s}
        />
      ))}
    </PickerContainer>
  );
}

// ─── Return picker ────────────────────────────────────────────────────────────

const RETURN_OPTIONS = [
  { v: 'low', l: 'Low', s: 'Nice-to-have' },
  { v: 'medium', l: 'Medium', s: 'Useful, not pivotal' },
  { v: 'high', l: 'High', s: 'Unlocks something material' },
] as const;

type ReturnValue = 'low' | 'medium' | 'high' | 'unknown';

function ReturnPicker({ value, onSelect }: { value: ReturnValue; onSelect: (v: ReturnValue) => void }) {
  return (
    <PickerContainer title="Return · how much will this move the goal?">
      {RETURN_OPTIONS.map((o) => (
        <OptionRow
          key={o.v}
          selected={value === o.v}
          onPress={() => onSelect(o.v)}
          label={o.l}
          sub={o.s}
        />
      ))}
    </PickerContainer>
  );
}

// ─── Week picker ──────────────────────────────────────────────────────────────

type WeekValue = 'this_week' | 'backlog';

const WEEK_OPTIONS: { v: WeekValue; l: string; s: string }[] = [
  { v: 'this_week', l: 'This week', s: "You're committing now" },
  { v: 'backlog', l: 'Backlog', s: 'For later — surfaces in Sunday set-up' },
];

function WeekPicker({ value, onSelect }: { value: WeekValue; onSelect: (v: WeekValue) => void }) {
  return (
    <PickerContainer title="Where does this live?">
      {WEEK_OPTIONS.map((o) => (
        <OptionRow
          key={o.v}
          selected={value === o.v}
          onPress={() => onSelect(o.v)}
          label={o.l}
          sub={o.s}
        />
      ))}
    </PickerContainer>
  );
}

// ─── Count picker (habit) ─────────────────────────────────────────────────────

function CountPicker({ value, onSelect }: { value: number; onSelect: (n: number) => void }) {
  return (
    <PickerContainer title="How often per week?" hint="Hit this = on-target">
      <View style={styles.countGrid}>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => {
          const on = value === n;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.countBtn, on && styles.countBtnOn]}
              onPress={() => onSelect(n)}
              activeOpacity={0.7}
            >
              <Text style={[styles.countBtnText, on && styles.countBtnTextOn]}>{n}×</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.countHint}>
        {value}× means {value} session{value > 1 ? 's' : ''} any time during the week.
      </Text>
    </PickerContainer>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

type FieldKey = 'theme' | 'effort' | 'return' | 'week' | 'count';

export default function QuickAdd() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: themes } = useThemes();
  const createTask = useCreateTask();
  const createHabit = useCreateHabit();

  const [type, setType] = useState<'task' | 'habit'>('task');
  const [title, setTitle] = useState('');
  const [openField, setOpenField] = useState<FieldKey | null>(null);

  // Task fields
  const [themeId, setThemeId] = useState(themes?.[0]?.id ?? '');
  const [effort, setEffort] = useState<EffortValue>('unknown');
  const [returnLevel, setReturnLevel] = useState<ReturnValue>('unknown');
  const [week, setWeek] = useState<WeekValue>('this_week');

  // Habit fields
  const [weeklyCount, setWeeklyCount] = useState(3);

  const activeThemeId = themeId || themes?.[0]?.id || '';
  const activeTheme = (themes ?? []).find((t) => t.id === activeThemeId);

  const toggle = (key: FieldKey) => setOpenField((o) => (o === key ? null : key));

  const canSave = title.trim().length > 0 && (themes?.length ?? 0) > 0;

  async function handleSave() {
    if (!canSave) return;
    if (type === 'task') {
      await createTask.mutateAsync({
        theme_id: activeThemeId,
        title: title.trim(),
        effort_level: effort,
        return_level: returnLevel,
        week_assignment: week,
      });
    } else {
      await createHabit.mutateAsync({
        theme_id: activeThemeId,
        title: title.trim(),
        weekly_target: weeklyCount,
      });
    }
    router.back();
  }

  const effortLabel = effort === 'unknown' ? 'set effort' : effort;
  const returnLabel = returnLevel === 'unknown' ? 'set return' : returnLevel;
  const weekLabel = week === 'this_week' ? 'this week' : 'backlog';

  // Ordered field list per type
  const TASK_FIELDS: FieldKey[] = ['theme', 'effort', 'return', 'week'];
  const HABIT_FIELDS: FieldKey[] = ['theme', 'count'];
  const fieldOrder = type === 'task' ? TASK_FIELDS : HABIT_FIELDS;
  const openIdx = openField ? fieldOrder.indexOf(openField) : -1;
  const above = openIdx === -1 ? fieldOrder : fieldOrder.slice(0, openIdx + 1);
  const below = openIdx === -1 ? [] : fieldOrder.slice(openIdx + 1);

  function renderChip(key: FieldKey) {
    if (key === 'theme') {
      const colorDot = (
        <View style={[styles.chipDot, { backgroundColor: activeTheme?.color ?? colors.text3 }]} />
      );
      return (
        <View key="theme" style={{ flexDirection: 'row' }}>
          <QAChip
            label="Theme"
            value={activeTheme?.name ?? '—'}
            isOpen={openField === 'theme'}
            onPress={() => toggle('theme')}
          />
        </View>
      );
    }
    if (key === 'effort') return (
      <QAChip
        key="effort"
        label="Effort"
        value={effortLabel}
        isOpen={openField === 'effort'}
        onPress={() => toggle('effort')}
      />
    );
    if (key === 'return') return (
      <QAChip
        key="return"
        label="Return"
        value={returnLabel}
        isOpen={openField === 'return'}
        onPress={() => toggle('return')}
      />
    );
    if (key === 'week') return (
      <QAChip
        key="week"
        label="Week"
        value={weekLabel}
        isOpen={openField === 'week'}
        onPress={() => toggle('week')}
      />
    );
    if (key === 'count') return (
      <QAChip
        key="count"
        label="Weekly"
        value={`${weeklyCount}× per week`}
        isOpen={openField === 'count'}
        onPress={() => toggle('count')}
      />
    );
    return null;
  }

  function renderPicker() {
    if (!openField) return null;
    if (openField === 'theme') return (
      <ThemePicker
        themes={themes ?? []}
        selectedId={activeThemeId}
        onSelect={(id) => { setThemeId(id); setOpenField(null); }}
      />
    );
    if (openField === 'effort') return (
      <EffortPicker
        value={effort}
        onSelect={(v) => { setEffort(v); setOpenField(null); }}
      />
    );
    if (openField === 'return') return (
      <ReturnPicker
        value={returnLevel}
        onSelect={(v) => { setReturnLevel(v); setOpenField(null); }}
      />
    );
    if (openField === 'week') return (
      <WeekPicker
        value={week}
        onSelect={(v) => { setWeek(v); setOpenField(null); }}
      />
    );
    if (openField === 'count') return (
      <CountPicker
        value={weeklyCount}
        onSelect={(n) => { setWeeklyCount(n); setOpenField(null); }}
      />
    );
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.page, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Icon name="x" size={20} color={colors.text2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New {type}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type toggle */}
        <View style={styles.typePill}>
          <TouchableOpacity
            style={[styles.typePillBtn, type === 'task' && styles.typePillBtnOn]}
            onPress={() => { setType('task'); setOpenField(null); }}
          >
            <Text style={[styles.typePillText, type === 'task' && styles.typePillTextOn]}>Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typePillBtn, type === 'habit' && styles.typePillBtnOn]}
            onPress={() => { setType('habit'); setOpenField(null); }}
          >
            <Text style={[styles.typePillText, type === 'habit' && styles.typePillTextOn]}>Habit</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder={type === 'task' ? 'What needs to get done?' : 'What will you practice?'}
            placeholderTextColor={colors.text3}
            autoFocus
            multiline
            returnKeyType="done"
          />
        </View>

        {/* Details label */}
        <Text style={styles.fieldLabel}>Details</Text>

        {/* Chips above open picker */}
        <View style={styles.chipsRow}>
          {above.map(renderChip)}
        </View>

        {/* Inline picker */}
        {renderPicker()}

        {/* Chips below open picker */}
        {below.length > 0 && (
          <View style={[styles.chipsRow, { marginTop: 12 }]}>
            {below.map(renderChip)}
          </View>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(22, insets.bottom) }]}>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => router.back()}>
          <Text style={styles.btnGhostText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, !canSave && styles.btnDisabled, { flex: 1.4 }]}
          onPress={handleSave}
          disabled={!canSave || createTask.isPending || createHabit.isPending}
        >
          <Text style={styles.btnPrimaryText}>
            {type === 'habit' ? 'Save habit' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    textTransform: 'capitalize',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Type toggle
  typePill: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    gap: 2,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  typePillBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 7,
  },
  typePillBtnOn: {
    backgroundColor: colors.accent,
  },
  typePillText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.text2,
  },
  typePillTextOn: {
    fontWeight: '600',
    color: '#1a1816',
  },
  // Title
  titleSection: {
    marginBottom: 22,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 30,
    letterSpacing: -0.24,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  qaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
  },
  qaChipOpen: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  qaChipKey: {
    fontSize: 11.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
    color: colors.text3,
    marginRight: 4,
  },
  qaChipKeyOpen: {
    color: colors.accentStrong,
  },
  qaChipValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accentStrong,
    fontWeight: '600',
  },
  pickerHint: {
    fontSize: 11,
    color: colors.text3,
  },
  // Option rows
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
  themeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  // Count picker
  countGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  countBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBtnOn: {
    backgroundColor: colors.accent,
  },
  countBtnText: {
    fontFamily: 'Georgia',
    fontWeight: '500',
    fontSize: 15,
    color: colors.text,
  },
  countBtnTextOn: {
    color: '#1a1816',
  },
  countHint: {
    fontSize: 11.5,
    color: colors.text3,
    marginTop: 8,
    lineHeight: 16,
  },
  // Bottom bar
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  btnGhost: {
    backgroundColor: colors.surface,
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
  btnDisabled: {
    opacity: 0.4,
  },
});
