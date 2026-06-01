import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';
import { getCurrentWeekStartDate } from '../lib/week.js';

async function getUserTimezone(userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_settings')
    .select('timezone')
    .eq('user_id', userId)
    .single();
  return data?.timezone ?? 'UTC';
}

export async function statsRoutes(fastify: FastifyInstance) {
  // GET /stats/current-week — live counts for this week (not from week_records)
  fastify.get('/stats/current-week', { preHandler: [authenticate] }, async (request, reply) => {
    const tz = await getUserTimezone(request.userId);
    const weekStart = getCurrentWeekStartDate(tz);

    const [tasksRes, activeHabitsRes, habitRecordsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('status')
        .eq('user_id', request.userId)
        .eq('week_assignment', 'this_week')
        .eq('week_start_date', weekStart)
        .neq('status', 'archived_done'),
      supabase
        .from('habits')
        .select('id')
        .eq('user_id', request.userId)
        .eq('status', 'active')
        .is('deleted_at', null),
      supabase
        .from('habit_week_records')
        .select('habit_id, target_met')
        .eq('user_id', request.userId)
        .eq('week_start_date', weekStart),
    ]);

    if (tasksRes.error) return reply.status(500).send({ error: tasksRes.error.message });
    if (activeHabitsRes.error) return reply.status(500).send({ error: activeHabitsRes.error.message });
    if (habitRecordsRes.error) return reply.status(500).send({ error: habitRecordsRes.error.message });

    const tasks = tasksRes.data ?? [];
    const activeHabitIds = new Set((activeHabitsRes.data ?? []).map((h) => h.id));
    const habitRecords = habitRecordsRes.data ?? [];

    // Total is the number of active habits, not the number of week records — week
    // records may not exist yet for habits created before this week / not yet
    // incremented. On-target counts only records belonging to active habits.
    return {
      tasks_done: tasks.filter((t) => t.status === 'done').length,
      tasks_total: tasks.length,
      habits_on_target: habitRecords.filter((h) => h.target_met && activeHabitIds.has(h.habit_id)).length,
      habits_total: activeHabitIds.size,
    };
  });

  // GET /stats/habit-streaks — active habits with current and best streak
  fastify.get('/stats/habit-streaks', { preHandler: [authenticate] }, async (request, reply) => {
    const { data, error } = await supabase
      .from('habits')
      .select('id, title, current_streak, best_streak')
      .eq('user_id', request.userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) return reply.status(500).send({ error: error.message });
    return data ?? [];
  });

  // GET /stats/past-weeks — week_records most recent first, paginated
  fastify.get('/stats/past-weeks', { preHandler: [authenticate] }, async (request, reply) => {
    const { page } = request.query as { page?: string };
    const pageNum = Math.max(0, parseInt(page ?? '0', 10) || 0);
    const pageSize = 20;
    const from = pageNum * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('week_records')
      .select('week_start_date, tasks_completed_count, tasks_total_count, habits_met_count, habits_total_count')
      .eq('user_id', request.userId)
      .order('week_start_date', { ascending: false })
      .range(from, to);

    if (error) return reply.status(500).send({ error: error.message });
    return data ?? [];
  });
}
