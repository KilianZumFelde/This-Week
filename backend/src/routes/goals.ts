import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';
import { CreateGoalRequestSchema, UpdateGoalRequestSchema } from '../lib/request-schemas.js';
import { getCurrentWeekStartDate } from '../lib/week.js';

async function getUserTimezone(userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_settings')
    .select('timezone')
    .eq('user_id', userId)
    .single();
  return data?.timezone ?? 'UTC';
}

export async function goalsRoutes(fastify: FastifyInstance) {
  // GET /goals — list all goals (active + archived/completed)
  fastify.get('/goals', { preHandler: [authenticate] }, async (request, reply) => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', request.userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  // POST /goals — create goal (enforce caps)
  fastify.post('/goals', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = CreateGoalRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { goal_type } = parsed.data;

    if (goal_type === 'secondary') {
      const { count } = await supabase
        .from('goals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', request.userId)
        .eq('goal_type', 'secondary')
        .eq('status', 'active');

      if ((count ?? 0) >= 2) {
        return reply.status(400).send({ error: 'Max 2 active secondary goals reached.' });
      }
    }

    const { data, error } = await supabase
      .from('goals')
      .insert({ ...parsed.data, user_id: request.userId })
      .select()
      .single();

    if (error) {
      // Unique index violation = duplicate active primary
      if (error.code === '23505') {
        return reply.status(400).send({ error: 'Max 1 active primary goal reached.' });
      }
      return reply.status(500).send({ error: error.message });
    }

    return reply.status(201).send(data);
  });

  // PATCH /goals/:id — update fields
  fastify.patch('/goals/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateGoalRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { data, error } = await supabase
      .from('goals')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return reply.status(400).send({ error: 'Max 1 active primary goal reached.' });
      }
      return reply.status(500).send({ error: error.message });
    }
    if (!data) return reply.status(404).send({ error: 'Not found' });
    return data;
  });

  // POST /goals/:id/mark-hit — complete goal, unlink tasks
  fastify.post('/goals/:id/mark-hit', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('goals')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Not found' });
    return data;
  });

  // POST /goals/:id/abandon — archive goal, unlink tasks
  fastify.post('/goals/:id/abandon', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('goals')
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Not found' });
    return data;
  });

  // GET /goals/:id/stats — task counts toward this goal this week
  fastify.get('/goals/:id/stats', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tz = await getUserTimezone(request.userId);
    const weekStart = getCurrentWeekStartDate(tz);

    const [tasksResult, habitsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, status', { count: 'exact' })
        .eq('user_id', request.userId)
        .eq('goal_id', id)
        .eq('week_assignment', 'this_week')
        .eq('week_start_date', weekStart),
      supabase
        .from('habits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', request.userId)
        .eq('goal_id', id)
        .eq('status', 'active'),
    ]);

    if (tasksResult.error) return reply.status(500).send({ error: tasksResult.error.message });
    if (habitsResult.error) return reply.status(500).send({ error: habitsResult.error.message });

    const tasks = tasksResult.data ?? [];
    return {
      tasks_this_week: tasks.length,
      tasks_completed_this_week: tasks.filter((t) => t.status === 'done').length,
      habits_linked: habitsResult.count ?? 0,
    };
  });
}
