import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../lib/tokens';
import { Icon } from '../components/Icon';

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Icon name="chevron-left" size={22} color={colors.text2} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>App</Text>
          <Text style={styles.title}>Settings</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Rows */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/(settings)/reminders')}
          activeOpacity={0.7}
        >
          <Icon name="bell" size={16} color={colors.text2} />
          <Text style={styles.rowLabel}>Reminders</Text>
          <View style={{ marginLeft: 'auto' }}>
            <Icon name="chevron-right" size={14} color={colors.text3} />
          </View>
        </TouchableOpacity>
      </View>
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
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
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
  },
  rowLabel: {
    fontSize: 14.5,
    color: colors.text,
    fontWeight: '500',
  },
});
