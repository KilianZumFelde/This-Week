import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, radius } from '../../lib/tokens';
import { Icon } from '../components/Icon';
import { useThemes, Theme } from '../../lib/hooks/useThemes';
import { api } from '../../lib/api';

const PRESET_COLORS = [
  '#8ea076', // sage
  '#7a90a8', // slate
  '#c87856', // accent
  '#d4b06a', // gold
  '#a86b5e', // brick
  '#7a8ea0', // steel blue
  '#a09076', // warm tan
  '#9076a0', // soft purple
  '#76a096', // teal
  '#c8a078', // warm amber
];

function ColorSwatch({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.swatchBtn, { backgroundColor: color }, selected && styles.swatchSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected && <Icon name="check" size={12} color="#1a1816" />}
    </TouchableOpacity>
  );
}

function AddThemeForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () => api.post('/themes', { name: name.trim(), color, sort_order: 999 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['themes'] });
      onDone();
    },
  });

  const canSave = name.trim().length > 0;

  return (
    <View style={styles.addForm}>
      <Text style={styles.sectionLabel}>New Theme</Text>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="Theme name"
        placeholderTextColor={colors.text3}
        autoFocus
        returnKeyType="done"
      />
      <View style={styles.swatchRow}>
        {PRESET_COLORS.map((c) => (
          <ColorSwatch
            key={c}
            color={c}
            selected={color === c}
            onPress={() => setColor(c)}
          />
        ))}
      </View>
      <View style={styles.addFormActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onDone} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={() => create.mutate()}
          disabled={!canSave || create.isPending}
          activeOpacity={0.7}
        >
          {create.isPending ? (
            <ActivityIndicator size="small" color="#1a1816" />
          ) : (
            <Text style={styles.saveBtnText}>Add theme</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EditThemeForm({ theme, onDone }: { theme: Theme; onDone: () => void }) {
  const [name, setName] = useState(theme.name);
  const [color, setColor] = useState(theme.color ?? PRESET_COLORS[0]);
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: () =>
      api.patch(`/themes/${theme.id}`, { name: name.trim(), color }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['themes'] });
      onDone();
    },
  });

  const canSave = name.trim().length > 0 && name.trim() !== theme.name || color !== theme.color;

  return (
    <View style={styles.addForm}>
      <Text style={styles.sectionLabel}>Edit Theme</Text>
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="Theme name"
        placeholderTextColor={colors.text3}
        autoFocus
        returnKeyType="done"
      />
      <View style={styles.swatchRow}>
        {PRESET_COLORS.map((c) => (
          <ColorSwatch
            key={c}
            color={c}
            selected={color === c}
            onPress={() => setColor(c)}
          />
        ))}
      </View>
      <View style={styles.addFormActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onDone} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={() => update.mutate()}
          disabled={!canSave || update.isPending}
          activeOpacity={0.7}
        >
          {update.isPending ? (
            <ActivityIndicator size="small" color="#1a1816" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ThemesManagement() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: themes, isLoading } = useThemes();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const deleteTheme = useMutation({
    mutationFn: (id: string) => api.delete(`/themes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['themes'] }),
    onError: (err: Error) => {
      Alert.alert('Cannot delete', err.message);
    },
  });

  const reorder = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) =>
      api.patch(`/themes/${id}`, { sort_order }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['themes'] }),
  });

  function confirmDelete(theme: Theme) {
    Alert.alert(
      `Delete "${theme.name}"?`,
      'This theme will be permanently removed. Themes with active tasks or habits cannot be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTheme.mutate(theme.id),
        },
      ]
    );
  }

  function moveUp(index: number) {
    if (!themes || index === 0) return;
    const prev = themes[index - 1];
    const curr = themes[index];
    reorder.mutate({ id: curr.id, sort_order: prev.sort_order });
    reorder.mutate({ id: prev.id, sort_order: curr.sort_order });
  }

  function moveDown(index: number) {
    if (!themes || index === themes.length - 1) return;
    const next = themes[index + 1];
    const curr = themes[index];
    reorder.mutate({ id: curr.id, sort_order: next.sort_order });
    reorder.mutate({ id: next.id, sort_order: curr.sort_order });
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
        >
          <Icon name="chevron-left" size={22} color={colors.text2} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Settings</Text>
          <Text style={styles.title}>Themes</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom) }}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your themes ({themes?.length ?? 0})</Text>
              {themes?.map((theme, index) =>
                editingId === theme.id ? (
                  <EditThemeForm
                    key={theme.id}
                    theme={theme}
                    onDone={() => setEditingId(null)}
                  />
                ) : (
                  <View key={theme.id} style={styles.themeRow}>
                    <View
                      style={[styles.swatch, { backgroundColor: theme.color ?? colors.text3 }]}
                    />
                    <Text style={styles.themeName} numberOfLines={1}>
                      {theme.name}
                    </Text>
                    <View style={styles.themeActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => moveUp(index)}
                        disabled={index === 0}
                        activeOpacity={0.6}
                      >
                        <Icon name="chevron-up" size={16} color={index === 0 ? colors.text3 : colors.text2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => moveDown(index)}
                        disabled={index === (themes?.length ?? 0) - 1}
                        activeOpacity={0.6}
                      >
                        <Icon name="chevron-down" size={16} color={index === (themes?.length ?? 0) - 1 ? colors.text3 : colors.text2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => setEditingId(theme.id)}
                        activeOpacity={0.7}
                      >
                        <Icon name="settings" size={15} color={colors.text2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => confirmDelete(theme)}
                        activeOpacity={0.7}
                      >
                        <Icon name="x" size={15} color={colors.brick} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              )}
            </View>

            {adding ? (
              <AddThemeForm onDone={() => setAdding(false)} />
            ) : (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setAdding(true)}
                  activeOpacity={0.7}
                >
                  <Icon name="plus" size={16} color={colors.accentStrong} />
                  <Text style={styles.addBtnText}>Add theme</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 30,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.6,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 8,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  themeName: {
    flex: 1,
    fontSize: 14.5,
    color: colors.text,
    fontWeight: '500',
  },
  themeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
  },
  addBtnText: {
    fontSize: 14,
    color: colors.accentStrong,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 24,
  },
  nameInput: {
    fontFamily: 'Georgia',
    fontSize: 20,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline2,
    paddingBottom: 10,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  swatchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
  addFormActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline2,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    color: colors.text2,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1.4,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    fontSize: 14,
    color: '#1a1816',
    fontWeight: '600',
  },
});
