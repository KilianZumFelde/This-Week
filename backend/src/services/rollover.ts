import { supabase } from '../lib/supabase.js';
import { getCurrentWeekStartDate } from '../lib/week.js';
import { getPreviousWeekStartDate } from '../lib/dateUtils.js';
import { shouldCreateRitual } from '../lib/rolloverUtils.js';
export { shouldCreateRitual } from '../lib/rolloverUtils.js';


export async function performRollover(
  userId: string,
  timezone: string,
): Promise<{ rolled_over: boolean; pending_ritual_id: string | null }> {
  const currentWeekStart = getCurrentWeekStartDate(timezone);
  const previousWeekStart = getPreviousWeekStartDate(currentWeekStart);

  // Idempotency: if week_records already exists for previous week, rollover is done
  const { data: existingRecord } = await supabase
    .from('week_records')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start_date', previousWeekStart)
    .maybeSingle();

  if (existingRecord) {
    const { data: pendingRitual } = await supabase
      .from('carry_over_rituals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    return { rolled_over: false, pending_ritual_id: pendingRitual?.id ?? null };
  }

  // Step 2: Fetch all previous-week tasks before archiving
  const { data: prevWeekTasks } = await supabase
    .from('tasks')
    .select('id, status, goal_id')
    .eq('user_id', userId)
    .eq('week_assignment', 'this_week')
    .eq('week_start_date', previousWeekStart);

  const allPrevTasks = prevWeekTasks ?? [];
  const donePrevTaskIds = allPrevTasks
    .filter((t) => t.status === 'done')
    .map((t) => t.id);

  // Step 2: Archive done tasks
  if (donePrevTaskIds.length > 0) {
    await supabase
      .from('tasks')
      .update({ status: 'archived_done' })
      .in('id', donePrevTaskIds);
  }

  // Step 3: Fetch previous-week habit records and primary goal, then create week_records
  const [habitRecordsRes, primaryGoalRes] = await Promise.all([
    supabase
      .from('habit_week_records')
      .select('habit_id, target_met')
      .eq('user_id', userId)
      .eq('week_start_date', previousWeekStart),
    supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .eq('goal_type', 'primary')
      .eq('status', 'active')
      .maybeSingle(),
  ]);

  const prevHabitRecords = habitRecordsRes.data ?? [];
  const primaryGoal = primaryGoalRes.data;

  const primaryGoalDoneCount = primaryGoal
    ? allPrevTasks.filter(
        (t) => t.status === 'done' && t.goal_id === primaryGoal.id,
      ).length
    : 0;

  await supabase.from('week_records').upsert(
    {
      user_id: userId,
      week_start_date: previousWeekStart,
      tasks_completed_count: donePrevTaskIds.length,
      tasks_total_count: allPrevTasks.length,
      habits_met_count: prevHabitRecords.filter((h) => h.target_met).length,
      habits_total_count: prevHabitRecords.length,
      primary_goal_id: primaryGoal?.id ?? null,
      primary_goal_tasks_completed_count: primaryGoalDoneCount,
    },
    { onConflict: 'user_id,week_start_date' },
  );

  // Step 4: Archive previous-week habit_week_records
  await supabase
    .from('habit_week_records')
    .update({ archived_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('week_start_date', previousWeekStart)
    .is('archived_at', null);

  // Step 5: Update habit streaks + Step 6: create new habit_week_records
  const { data: activeHabits } = await supabase
    .from('habits')
    .select('id, target_count, current_streak, best_streak')
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null);

  const habits = activeHabits ?? [];

  for (const habit of habits) {
    const prevRecord = prevHabitRecords.find((r) => r.habit_id === habit.id);
    const targetMet = prevRecord?.target_met ?? false;

    if (targetMet) {
      const newStreak = habit.current_streak + 1;
      await supabase
        .from('habits')
        .update({
          current_streak: newStreak,
          best_streak: Math.max(habit.best_streak, newStreak),
        })
        .eq('id', habit.id);
    } else {
      await supabase
        .from('habits')
        .update({ current_streak: 0 })
        .eq('id', habit.id);
    }

    // Create new week record for new week (idempotent via upsert)
    await supabase
      .from('habit_week_records')
      .upsert(
        {
          user_id: userId,
          habit_id: habit.id,
          week_start_date: currentWeekStart,
          target_count: habit.target_count,
          completed_count: 0,
        },
        { onConflict: 'habit_id,week_start_date' },
      );
  }

  // Step 7–8: Identify open tasks + active goals, create carry_over_ritual if needed
  const openPrevTasks = allPrevTasks.filter((t) => t.status === 'open');

  const { data: activeGoalsData } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active');
  const hasActiveGoals = (activeGoalsData ?? []).length > 0;

  let pendingRitualId: string | null = null;

  // Create ritual when there are leftover tasks OR active goals (goal step runs every Sunday)
  if (shouldCreateRitual(openPrevTasks.length, hasActiveGoals)) {
    const { data: ritual, error: ritualError } = await supabase
      .from('carry_over_rituals')
      .upsert(
        {
          user_id: userId,
          from_week_start_date: previousWeekStart,
          to_week_start_date: currentWeekStart,
          status: 'pending',
        },
        { onConflict: 'user_id,from_week_start_date,to_week_start_date', ignoreDuplicates: false },
      )
      .select('id')
      .single();

    if (!ritualError && ritual) {
      pendingRitualId = ritual.id;

      // Only create decision rows when there are leftover open tasks
      if (openPrevTasks.length > 0) {
        const decisionRows = openPrevTasks.map((t) => ({
          ritual_id: ritual.id,
          user_id: userId,
          task_id: t.id,
          decision: null,
        }));

        await supabase
          .from('carry_over_task_decisions')
          .upsert(decisionRows, { onConflict: 'ritual_id,task_id', ignoreDuplicates: true });
      }
    }
  }

  return { rolled_over: true, pending_ritual_id: pendingRitualId };
}
