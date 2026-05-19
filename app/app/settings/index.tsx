import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expoConfig = Constants.expoConfig as any;
import { colors, radius } from '../../lib/tokens';
import { Icon } from '../components/Icon';
import { useUserSettings, useUpdateUserSettings } from '../../lib/hooks/useUserSettings';

const THEME_OPTIONS: { value: 'dark' | 'light' | 'system'; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: settings, isLoading } = useUserSettings();
  const update = useUpdateUserSettings();

  const appVersion = (expoConfig?.version ?? '—') as string;

  function toggleNudges(value: boolean) {
    update.mutate({ danger_zone_nudges_enabled: value });
  }

  function setThemeMode(mode: 'dark' | 'light' | 'system') {
    update.mutate({ theme_mode: mode });
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        >
          <Icon name="chevron-left" size={22} color={colors.text2} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>App</Text>
          <Text style={styles.title}>Settings</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom) }}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Themes */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Themes</Text>
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push('/settings/themes')}
                activeOpacity={0.7}
              >
                <Icon name="target" size={16} color={colors.text2} />
                <Text style={styles.rowLabel}>Manage Themes</Text>
                <View style={{ marginLeft: 'auto' }}>
                  <Icon name="chevron-right" size={14} color={colors.text3} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Notifications */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notifications</Text>
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push('/settings/reminders')}
                activeOpacity={0.7}
              >
                <Icon name="bell" size={16} color={colors.text2} />
                <Text style={styles.rowLabel}>Reminders</Text>
                <View style={{ marginLeft: 'auto' }}>
                  <Icon name="chevron-right" size={14} color={colors.text3} />
                </View>
              </TouchableOpacity>
              <View style={[styles.row, styles.rowSpaced]}>
                <View style={styles.rowLeft}>
                  <Icon name="bell" size={16} color={colors.text2} />
                  <View>
                    <Text style={styles.rowLabel}>Habit nudges</Text>
                    <Text style={styles.rowSub}>Alerts when habits are in the danger zone</Text>
                  </View>
                </View>
                <Switch
                  value={settings?.danger_zone_nudges_enabled ?? true}
                  onValueChange={toggleNudges}
                  trackColor={{ false: colors.surfaceHi, true: colors.accent }}
                  thumbColor={colors.text}
                  disabled={update.isPending}
                />
              </View>
            </View>

            {/* Appearance */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Appearance</Text>
              <View style={styles.segContainer}>
                {THEME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.segButton,
                      settings?.theme_mode === opt.value && styles.segButtonActive,
                    ]}
                    onPress={() => setThemeMode(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.segLabel,
                        settings?.theme_mode === opt.value && styles.segLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* About */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>About</Text>
              <View style={styles.row}>
                <Icon name="settings" size={16} color={colors.text2} />
                <Text style={styles.rowLabel}>Weekly Focus</Text>
                <Text style={[styles.rowLabel, { marginLeft: 'auto', color: colors.text3 }]}>
                  v{appVersion}
                </Text>
              </View>
            </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  rowSpaced: {
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  rowLabel: {
    fontSize: 14.5,
    color: colors.text,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
  segContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 3,
    gap: 2,
  },
  segButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  segButtonActive: {
    backgroundColor: colors.accent,
  },
  segLabel: {
    fontSize: 13,
    color: colors.text2,
    fontWeight: '500',
  },
  segLabelActive: {
    color: '#1a1816',
    fontWeight: '600',
  },
});
