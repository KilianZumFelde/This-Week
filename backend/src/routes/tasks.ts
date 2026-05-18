import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';
import {
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  ListTasksQuerySchema,
} from '../lib/request-schemas.js';
import { getCurrentWeekStartDate } from '../lib/week.js';

async function getUserTimezone(userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_settings')
    .select('timezone')
    .eq('user_id', userId)
    .single();
  return data?.timezone ?? 'UTC';
}

export async function tasksRoutes(fastify: FastifyInstance) {
  fastify.get('/tasks', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = ListTasksQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { week_assignment, week_start_date, status } = parsed.data;

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', request.userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (week_assignment) query = query.eq('week_assignment', week_assignment);
    if (week_start_date) query = query.eq('week_start_date', week_start_date);
    if (status) {
      query = query.eq('status', status);
    } else {
      // Default: exclude archived
      query = query.neq('status', 'archived_done');
    }

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  fastify.post('/tasks', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = CreateTaskRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const body = parsed.data;

    // Resolve week_start_date when assigning to this_week
    let weekStartDate = body.week_start_date ?? null;
    const weekAssignment = body.week_assignment ?? 'this_week';
    if (weekAssignment === 'this_week' && !weekStartDate) {
      const tz = await getUserTimezone(request.userId);
      weekStartDate = getCurrentWeekStartDate(tz);
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...body,
        user_id: request.userId,
        week_assignment: weekAssignment,
        week_start_date: weekStartDate,
      })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  fastify.patch('/tasks/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateTaskRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { data, error } = await supabase
      .from('tasks')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Not found' });
    return data;
  });

  fastify.delete('/tasks/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', request.userId);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(204).send();
  });

  fastify.post('/tasks/:id/complete', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', request.userId)
      .eq('status', 'open')
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Task not found or already completed' });
    return data;
  });

  fastify.post('/tasks/:id/reopen', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'open', completed_at: null })
      .eq('id', id)
      .eq('user_id', request.userId)
      .eq('status', 'done')
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Task not found or not completed' });
    return data;
  });

  fastify.post('/tasks/:id/promote', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tz = await getUserTimezone(request.userId);
    const weekStartDate = getCurrentWeekStartDate(tz);

    const { data, error } = await supabase
      .from('tasks')
      .update({ week_assignment: 'this_week', week_start_date: weekStartDate })
      .eq('id', id)
      .eq('user_id', request.userId)
      .eq('week_assignment', 'backlog')
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Task not found or not in backlog' });
    return data;
  });
}
