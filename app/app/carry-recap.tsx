import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, fonts } from '../lib/tokens';
import { api } from '../lib/api';
import { Icon } from './components/Icon';

type StreakChange = {
  habit_id: string;
  title: string;
  increased: boolean;
  current_streak: number;
};

type PrimaryGoal = {
  id: string;
  title: string;
  tasks_completed_count: number;
};

type Recap = {
  tasks_completed_count: number;
  tasks_total_count: number;
  habits_met_count: number;
  habits_total_count: number;
  streak_changes: StreakChange[];
  primary_goal: PrimaryGoal | null;
};

type RitualData = {
  ritual: { id: string; to_week_start_date: string };
  decisions: any[];
  recap: Recap;
};

export default function CarryRecap() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<RitualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<RitualData>('/carry-over/pending')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.page, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 80 }} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.page, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Could not load recap. Please restart the app.</Text>
      </View>
    );
  }

  const { recap, decisions } = data;
  const undecidedCount = decisions.filter((d) => d.decision === null).length;

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      {/* Modal header */}
      <View style={styles.modalHead}>
        <Text style={styles.stepLabel}>SUNDAY SET-UP · 1 OF 3</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Last week</Text>

        {/* Fractions row */}
        <View style={styles.fracsRow}>
          <View>
            <Text style={styles.recapNum}>
              {recap.tasks_completed_count}
              <Text style={styles.of}>/{recap.tasks_total_count}</Text>
            </Text>
            <Text style={styles.recapLabel}>TASKS DONE</Text>
          </View>
          <View>
            <Text style={styles.recapNum}>
              {recap.habits_met_count}
              <Text style={styles.of}>/{recap.habits_total_count}</Text>
            </Text>
            <Text style={styles.recapLabel}>HABITS ON TARGET</Text>
          </View>
        </View>

        {/* Streaks card */}
        {recap.streak_changes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>STREAKS</Text>
            {recap.streak_changes.map((s) => (
              <View key={s.habit_id} style={styles.streakRow}>
                <Icon
                  name={s.increased ? 'flame' : 'refresh'}
                  size={16}
                  color={s.increased ? colors.gold : colors.brick}
                />
                <Text style={styles.streakTitle}>{s.title}</Text>
                <Text
                  style={[
                    styles.streakValue,
                    { color: s.increased ? colors.gold : colors.brick },
                  ]}
                >
                  {s.increased ? `→ ${s.current_streak} weeks` : 'reset to 0'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Goal card */}
        {recap.primary_goal && (
          <View style={[styles.card, { marginBottom: 0 }]}>
            <Text style={styles.goalLabel}>STILL WORKING TOWARD</Text>
            <Text style={styles.goalTitle}>{recap.primary_goal.title}</Text>
            <Text style={styles.goalSub}>
              {recap.primary_goal.tasks_completed_count} task
              {recap.primary_goal.tasks_completed_count !== 1 ? 's' : ''} done toward it last week
            </Text>
          </View>
        )}

        <View style={{ flex: 1, minHeight: 24 }} />

        {/* CTA */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/carry-triage')}
        >
          <Text style={styles.primaryBtnText}>Review leftovers</Text>
          <Icon name="arrow" size={16} color={colors.bg} />
        </TouchableOpacity>
        <Text style={styles.footer}>
          {undecidedCount} task{undecidedCount !== 1 ? 's' : ''} from last week need a decision
          before this week starts.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.text3,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.56,
    color: colors.text,
    marginBottom: 28,
    marginTop: 14,
  },
  fracsRow: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'baseline',
    marginBottom: 26,
  },
  recapNum: {
    fontFamily: fonts.serif,
    fontSize: 64,
    fontWeight: '400',
    letterSpacing: -1.92,
    color: colors.text,
    lineHeight: 64,
  },
  of: {
    color: colors.text3,
    fontSize: 64,
    fontFamily: fonts.serif,
  },
  recapLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.text3,
    fontWeight: '500',
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.text3,
    fontWeight: '600',
    marginBottom: 10,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  streakTitle: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.accentStrong,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalTitle: {
    fontFamily: fonts.serif,
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  goalSub: {
    fontSize: 13,
    color: colors.text2,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  primaryBtnText: {
    color: colors.bg,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  footer: {
    fontSize: 11.5,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 17,
  },
  errorText: {
    color: colors.text2,
    textAlign: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
    fontSize: 15,
  },
});
