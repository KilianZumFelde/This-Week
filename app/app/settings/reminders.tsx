import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, radius } from '../../lib/tokens';
import { Icon } from '../components/Icon';
import { api } from '../../lib/api';
import { format } from 'date-fns';

type ReminderRow = {
  id: string;
  task_id: string;
  kind: 'one_shot' | 'recurring_until_done';
  status: string;
  scheduled_for: string;
  next_run_at: string | null;
  tasks: { title: string } | null;
};

function useReminders() {
  return useQuery<ReminderRow[]>({
    queryKey: ['reminders'],
    queryFn: () => api.get<ReminderRow[]>('/notifications/reminders'),
  });
}

function formatReminderTime(row: ReminderRow): string {
  const dt = row.kind === 'recurring_until_done' && row.next_run_at
    ? new Date(row.next_run_at)
    : new Date(row.scheduled_for);
  return format(dt, 'MMM d, yyyy · h:mm a');
}

export default function Reminders() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: reminders, isLoading } = useReminders();

  const deleteAll = useMutation({
    mutationFn: () => api.delete('/notifications/reminders'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });

  function confirmDeleteAll() {
    Alert.alert(
      'Delete all reminders',
      'This will cancel all scheduled task reminders. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => deleteAll.mutate(),
        },
      ]
    );
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Icon name="chevron-left" size={22} color={colors.text2} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Settings</Text>
          <Text style={styles.title}>Reminders</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom) }}
      >
        {isLoading && (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        )}

        {!isLoading && (!reminders || reminders.length === 0) && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No scheduled reminders.</Text>
          </View>
        )}

        {!isLoading && reminders && reminders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Scheduled ({reminders.length})</Text>
            {reminders.map((r) => (
              <View key={r.id} style={styles.row}>
                <View style={{ flexShrink: 0 }}>
                  <Icon name="bell" size={16} color={colors.text2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {r.tasks?.title ?? 'Task'}
                  </Text>
                  <Text style={styles.rowSub}>
                    {formatReminderTime(r)}
                    {r.kind === 'recurring_until_done' ? ' · daily until done' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!isLoading && reminders && reminders.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={confirmDeleteAll}
              disabled={deleteAll.isPending}
              activeOpacity={0.7}
            >
              <Icon name="x" size={15} color={colors.brick} />
              <Text style={styles.deleteBtnText}>Delete all configured reminders</Text>
            </TouchableOpacity>
          </View>
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
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14.5,
    color: colors.text2,
  },
  section: {
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
    padding: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 13.5,
    color: colors.text,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 11.5,
    color: colors.text3,
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline2,
    borderRadius: radius.md,
    padding: 14,
  },
  deleteBtnText: {
    fontSize: 13.5,
    color: colors.brick,
    fontWeight: '500',
  },
});
