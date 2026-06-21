import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';

export async function carryOverRoutes(fastify: FastifyInstance) {
  // GET /carry-over/pending — pending ritual + decisions + recap data
  fastify.get('/carry-over/pending', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.userId;

    const { data: ritual, error: ritualError } = await supabase
      .from('carry_over_rituals')
      .select('id, from_week_start_date, to_week_start_date, status')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ritualError) return reply.status(500).send({ error: ritualError.message });
    if (!ritual) return reply.status(404).send({ error: 'No pending ritual' });

    // Decisions with full task details
    const { data: decisions, error: decisionsError } = await supabase
      .from('carry_over_task_decisions')
      .select(`
        id,
        decision,
        tasks (
          id,
          title,
          effort_level,
          return_level,
          created_at,
          goal_id,
          theme_id,
          themes ( id, name, color )
        )
      `)
      .eq('ritual_id', ritual.id)
      .order('created_at', { ascending: true });

    if (decisionsError) return reply.status(500).send({ error: decisionsError.message });

    // Recap: week_records for previous week
    const { data: weekRecord } = await supabase
      .from('week_records')
      .select('tasks_completed_count, tasks_total_count, habits_met_count, habits_total_count, primary_goal_id, primary_goal_tasks_completed_count')
      .eq('user_id', userId)
      .eq('week_start_date', ritual.from_week_start_date)
      .maybeSingle();

    // Streak changes: previous-week habit records + current streaks
    const { data: prevHabitRecords } = await supabase
      .from('habit_week_records')
      .select('habit_id, target_met')
      .eq('user_id', userId)
      .eq('week_start_date', ritual.from_week_start_date);

    const { data: activeHabits } = await supabase
      .from('habits')
      .select('id, title, current_streak')
      .eq('user_id', userId)
      .eq('status', 'active');

    const prevRecordMap = new Map(
      (prevHabitRecords ?? []).map((r) => [r.habit_id, r.target_met]),
    );

    const streakChanges = (activeHabits ?? []).map((h) => ({
      habit_id: h.id,
      title: h.title,
      increased: prevRecordMap.get(h.id) === true,
      current_streak: h.current_streak,
    }));

    // Primary goal details
    let primaryGoal = null;
    if (weekRecord?.primary_goal_id) {
      const { data: goal } = await supabase
        .from('goals')
        .select('id, title')
        .eq('id', weekRecord.primary_goal_id)
        .maybeSingle();
      if (goal) {
        primaryGoal = {
          id: goal.id,
          title: goal.title,
          tasks_completed_count: weekRecord.primary_goal_tasks_completed_count,
        };
      }
    }

    // Enrich decisions with goal title
    const goalIds = [
      ...new Set(
        (decisions ?? [])
          .map((d: any) => d.tasks?.goal_id)
          .filter(Boolean),
      ),
    ] as string[];

    const goalMap = new Map<string, string>();
    if (goalIds.length > 0) {
      const { data: goals } = await supabase
        .from('goals')
        .select('id, title')
        .in('id', goalIds);
      for (const g of goals ?? []) goalMap.set(g.id, g.title);
    }

    const enrichedDecisions = (decisions ?? []).map((d: any) => ({
      id: d.id,
      decision: d.decision,
      task: d.tasks
        ? {
            id: d.tasks.id,
            title: d.tasks.title,
            effort_level: d.tasks.effort_level,
            return_level: d.tasks.return_level,
            created_at: d.tasks.created_at,
            theme: d.tasks.themes ?? null,
            goal_title: d.tasks.goal_id ? (goalMap.get(d.tasks.goal_id) ?? null) : null,
          }
        : null,
    }));

    return {
      ritual: {
        id: ritual.id,
        from_week_start_date: ritual.from_week_start_date,
        to_week_start_date: ritual.to_week_start_date,
        status: ritual.status,
      },
      decisions: enrichedDecisions,
      recap: {
        tasks_completed_count: weekRecord?.tasks_completed_count ?? 0,
        tasks_total_count: weekRecord?.tasks_total_count ?? 0,
        habits_met_count: weekRecord?.habits_met_count ?? 0,
        habits_total_count: weekRecord?.habits_total_count ?? 0,
        streak_changes: streakChanges,
        primary_goal: primaryGoal,
      },
    };
  });

  // POST /carry-over/:ritualId/decisions/:decisionId — record one decision
  fastify.post<{
    Params: { ritualId: string; decisionId: string };
    Body: { decision: 'keep_this_week' | 'send_to_backlog' | 'drop' };
  }>(
    '/carry-over/:ritualId/decisions/:decisionId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { ritualId, decisionId } = request.params;
      const { decision } = request.body ?? {};
      const userId = request.userId;

      if (!['keep_this_week', 'send_to_backlog', 'drop'].includes(decision)) {
        return reply.status(400).send({ error: 'Invalid decision' });
      }

      // Verify decision belongs to this user's ritual
      const { data: decisionRow, error: decisionFetchError } = await supabase
        .from('carry_over_task_decisions')
        .select('id, ritual_id, task_id')
        .eq('id', decisionId)
        .eq('ritual_id', ritualId)
        .eq('user_id', userId)
        .maybeSingle();

      if (decisionFetchError) return reply.status(500).send({ error: decisionFetchError.message });
      if (!decisionRow) return reply.status(404).send({ error: 'Decision not found' });

      // Fetch the ritual to get the new week start date
      const { data: ritual } = await supabase
        .from('carry_over_rituals')
        .select('to_week_start_date')
        .eq('id', ritualId)
        .eq('user_id', userId)
        .single();

      if (!ritual) return reply.status(404).send({ error: 'Ritual not found' });

      // Apply task change
      if (decision === 'keep_this_week') {
        await supabase
          .from('tasks')
          .update({
            week_assignment: 'this_week',
            week_start_date: ritual.to_week_start_date,
            status: 'open',
          })
          .eq('id', decisionRow.task_id)
          .eq('user_id', userId);
      } else if (decision === 'send_to_backlog') {
        await supabase
          .from('tasks')
          .update({
            week_assignment: 'backlog',
            week_start_date: null,
            status: 'open',
          })
          .eq('id', decisionRow.task_id)
          .eq('user_id', userId);
      } else if (decision === 'drop') {
        await supabase
          .from('tasks')
          .delete()
          .eq('id', decisionRow.task_id)
          .eq('user_id', userId);
      }

      // Record the decision
      await supabase
        .from('carry_over_task_decisions')
        .update({ decision, decided_at: new Date().toISOString() })
        .eq('id', decisionId);

      // Check whether all task decisions are made. This advances the triage
      // step to the goal step on the client — it does NOT complete the ritual.
      // The ritual is only completed at "Start week" (POST .../complete), so
      // that goal-step-only rituals (no leftover tasks) also get marked done.
      const { data: remaining } = await supabase
        .from('carry_over_task_decisions')
        .select('id')
        .eq('ritual_id', ritualId)
        .is('decision', null);

      const allDone = (remaining ?? []).length === 0;

      return { ok: true, ritual_completed: allDone };
    },
  );

  // POST /carry-over/:ritualId/complete — finish the ritual ("Start week").
  // Idempotent: marks the user's ritual completed so it stops re-opening every
  // session. This is the single completion point for ALL rituals, including
  // those with no leftover tasks (which create no task decisions).
  fastify.post<{ Params: { ritualId: string } }>(
    '/carry-over/:ritualId/complete',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { ritualId } = request.params;
      const userId = request.userId;

      const { data, error } = await supabase
        .from('carry_over_rituals')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', ritualId)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();

      if (error) return reply.status(500).send({ error: error.message });
      if (!data) return reply.status(404).send({ error: 'Ritual not found' });

      return { ok: true };
    },
  );
}
