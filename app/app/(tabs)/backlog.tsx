import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Svg, { Rect as SvgRect, Path as SvgPath } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { colors, radius } from '../../lib/tokens';
import {
  useBacklogTasks,
  usePromoteTask,
  useUpdateTask,
  Task,
} from '../../lib/hooks/useTasks';
import { useThemes, Theme } from '../../lib/hooks/useThemes';
import { useUndoStore } from '../../lib/stores/undo-store';
import { Icon } from '../components/Icon';
import { TaskDetailSheet } from '../components/TaskDetailSheet';
import { SkeletonRow, ScreenError } from '../components/Skeleton';

// ─── Chip helpers ─────────────────────────────────────────────────────────────

function ThemeChip({ theme }: { theme: Theme | undefined }) {
  if (!theme) return null;
  const color = theme.color ?? colors.text2;
  return (
    <View style={[styles.chip, { backgroundColor: `${color}22` }]}>
      <View style={[styles.chipDot, { backgroundColor: color }]} />
      <Text style={[styles.chipText, { color }]}>{theme.name}</Text>
    </View>
  );
}

// ─── Priority border ─────────────────────────────────────────────────────────

function derivePriority(effort: string, ret: string): 'high' | 'mid' | 'low' {
  let score: number;
  if      (ret === 'high'   && effort === 'low')    score = 4;
  else if (ret === 'high'   && effort === 'medium') score = 3;
  else if (ret === 'high'   && effort === 'high')   score = 3;
  else if (ret === 'medium' && effort === 'low')    score = 3;
  else if (ret === 'medium' && effort === 'medium') score = 2;
  else if (ret === 'medium' && effort === 'high')   score = 1;
  else if (ret === 'low'    && effort === 'low')    score = 1;
  else if (ret === 'low'    && effort === 'medium') score = 1;
  else if (ret === 'low'    && effort === 'high')   score = 0;
  else score = 2;
  if (score >= 3) return 'high';
  if (score === 2) return 'mid';
  return 'low';
}

const PRIORITY_BORDER: Record<'high' | 'mid' | 'low', string> = {
  high: colors.gold,
  mid: colors.text3,
  low: colors.surfaceHi,
};

// ─── Task row (backlog variant — circle promotes, not completes) ──────────────

type BacklogTaskRowProps = {
  task: Task;
  theme: Theme | undefined;
  onPromote: () => void;
  onPressBody: () => void;
};

function BacklogTaskRow({ task, theme, onPromote, onPressBody }: BacklogTaskRowProps) {
  const borderColor = PRIORITY_BORDER[derivePriority(task.effort_level, task.return_level)];
  return (
    <View style={styles.taskRow}>
      <View style={[styles.taskPriorityStripe, { backgroundColor: borderColor }]} />}
      <TouchableOpacity
        onPress={onPromote}
        style={styles.taskCheck}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
      >
        <Icon name="arrow-up" size={12} color={colors.text3} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.taskBody} onPress={onPressBody} activeOpacity={0.7}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={styles.taskMeta}>
          <ThemeChip theme={theme} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Empty state SVG (inbox icon from prototype) ──────────────────────────────

function InboxSvg() {
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
      <SvgRect x={6} y={14} width={44} height={32} rx={6} stroke={colors.text2} strokeWidth={1.2} />
      <SvgPath d="M6 24h14l3 4h10l3-4h14" stroke={colors.text2} strokeWidth={1.2} />
    </Svg>
  );
}

// ─── Backlog screen ───────────────────────────────────────────────────────────

type SortMode = 'theme' | 'priority' | 'recent';

export default function Backlog() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sort, setSort] = useState<SortMode>('theme');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks, isLoading, isError, refetch } = useBacklogTasks();
  const { data: themes } = useThemes();
  const promoteTask = usePromoteTask();
  const updateTask = useUpdateTask();
  const showUndo = useUndoStore((s) => s.show);

  const themeMap = Object.fromEntries((themes ?? []).map((t) => [t.id, t]));
  const allTasks = tasks ?? [];

  // Initialise openGroups so first 2 theme groups are open by default
  function isGroupOpen(themeId: string, groupIndex: number): boolean {
    if (themeId in openGroups) return openGroups[themeId];
    return groupIndex < 2;
  }

  function toggleGroup(themeId: string, groupIndex: number) {
    setOpenGroups((o) => {
      const currentOpen = themeId in o ? o[themeId] : groupIndex < 2;
      return { ...o, [themeId]: !currentOpen };
    });
  }

  // Build sorted/grouped content
  const sortedTasks = [...allTasks].sort((a, b) => {
    if (sort === 'priority') {
      const rank = { high: 0, medium: 1, low: 2, unknown: 3 };
      return (rank[a.effort_level] ?? 3) - (rank[b.effort_level] ?? 3);
    }
    if (sort === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  // Theme groups (only used in "By theme" sort)
  const themeGroups = (themes ?? [])
    .map((theme, idx) => ({
      theme,
      idx,
      tasks: allTasks.filter((t) => t.theme_id === theme.id),
    }))
    .filter((g) => g.tasks.length > 0);

  const isEmpty = !isLoading && allTasks.length === 0;

  function handlePromote(task: Task) {
    promoteTask.mutate(task.id);
    showUndo({
      label: `"${task.title}" moved to This Week`,
      undo: () => updateTask.mutate({ id: task.id, week_assignment: 'backlog', week_start_date: null }),
    });
  }

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Page header */}
      <View style={styles.pageHead}>
        <View>
          <Text style={styles.eyebrow}>For later</Text>
          <Text style={styles.h1}>Backlog</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
          <Icon name="settings" size={20} color={colors.text2} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 140 }}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </ScrollView>
      ) : isError ? (
        <ScreenError onRetry={refetch} />
      ) : isEmpty ? (
        <View style={styles.emptyState}>
          <View style={{ opacity: 0.6, marginBottom: 24 }}>
            <InboxSvg />
          </View>
          <Text style={styles.emptyTitle}>Your backlog is empty.</Text>
          <Text style={styles.emptySubtitle}>
            Tasks you don't want for this week land here. Tap the mic or + to add one.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.accent} />
          }
        >
          {/* Sort control */}
          <View style={styles.seg}>
            {(['theme', 'priority', 'recent'] as SortMode[]).map((s) => {
              const label = s === 'theme' ? 'By theme' : s === 'priority' ? 'By priority' : 'Recent';
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.segBtn, sort === s && styles.segBtnOn]}
                  onPress={() => setSort(s)}
                >
                  <Text style={[styles.segBtnText, sort === s && styles.segBtnTextOn]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Theme groups */}
          {sort === 'theme' ? (
            themeGroups.map(({ theme, idx, tasks: groupTasks }) => {
              const open = isGroupOpen(theme.id, idx);
              return (
                <View key={theme.id}>
                  <TouchableOpacity
                    style={styles.themeGroup}
                    onPress={() => toggleGroup(theme.id, idx)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={open ? 'chevron-down' : 'chevron-right'}
                      size={14}
                      color={colors.text3}
                    />
                    <View style={[styles.themeSwatch, { backgroundColor: theme.color ?? colors.text3 }]} />
                    <Text style={styles.themeName}>{theme.name.toUpperCase()}</Text>
                    <Text style={styles.themeCount}>· {groupTasks.length}</Text>
                  </TouchableOpacity>
                  {open &&
                    groupTasks.map((task) => (
                      <BacklogTaskRow
                        key={task.id}
                        task={task}
                        theme={themeMap[task.theme_id]}
                        onPromote={() => handlePromote(task)}
                        onPressBody={() => setSelectedTask(task)}
                      />
                    ))}
                </View>
              );
            })
          ) : (
            sortedTasks.map((task) => (
              <BacklogTaskRow
                key={task.id}
                task={task}
                theme={themeMap[task.theme_id]}
                onPromote={() => handlePromote(task)}
                onPressBody={() => setSelectedTask(task)}
              />
            ))
          )}
        </ScrollView>
      )}

      <TaskDetailSheet
        task={selectedTask}
        themes={themes ?? []}
        onClose={() => setSelectedTask(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  pageHead: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 4,
  },
  h1: {
    fontFamily: 'Georgia',
    fontWeight: '500',
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.6,
    color: colors.text,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Segmented control
  seg: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    gap: 2,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  segBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  segBtnOn: {
    backgroundColor: colors.surfaceHi,
  },
  segBtnText: {
    fontSize: 12.5,
    color: colors.text2,
    fontWeight: '500',
  },
  segBtnTextOn: {
    color: colors.text,
  },
  // Theme group header
  themeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 8,
  },
  themeSwatch: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.text,
  },
  themeCount: {
    fontSize: 12,
    color: colors.text3,
  },
  // Task row
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: 8,
    overflow: 'hidden',
  },
  taskPriorityStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  taskCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.text3,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskBody: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: 14.5,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 19.5,
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
  },
  // Chips
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: colors.surface2,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.85,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.text2,
  },
  // Empty state
  emptyState: {
    flex: 1,
    paddingHorizontal: 36,
    paddingBottom: 140,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.22,
    color: colors.text,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14.5,
    color: colors.text2,
    lineHeight: 22.5,
  },
});
