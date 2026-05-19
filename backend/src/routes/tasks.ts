import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';
import {
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  ListTasksQuerySchema,
  ReminderSpecSchema,
} from '../lib/request-schemas.js';
import { getCurrentWeekStartDate } from '../lib/week.js';

async function createReminderForTask(
  userId: string,
  taskId: string,
  spec: z.infer<typeof ReminderSpecSchema>,
  userTimezone: string
): Promise<void> {
  let scheduledFor = spec.scheduled_for;

  // Default to 09:00 local today if no scheduled_for provided
  if (!scheduledFor) {
    const now = new Date();
    // Approximate: use the ISO date with 09:00 UTC offset
    // For production accuracy, use a timezone library; this is close enough for v1
    const todayStr = now.toLocaleDateString('sv-SE', { timeZone: userTimezone }); // YYYY-MM-DD
    scheduledFor = `${todayStr}T09:00:00`;
  }

  const row: Record<string, unknown> = {
    user_id: userId,
    task_id: taskId,
    kind: spec.kind,
    status: 'scheduled',
    scheduled_for: scheduledFor,
    recurrence_rule: spec.recurrence_rule ?? null,
    next_run_at: spec.kind === 'recurring_until_done' ? scheduledFor : null,
  };

  await supabase.from('reminders').insert(row);
}

async function cancelRemindersForTask(userId: string, taskId: string): Promise<void> {
  await supabase
    .from('reminders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .eq('status', 'scheduled');
}

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

    const { reminder_spec, ...rest } = parsed.data;

    // Resolve week_start_date when assigning to this_week
    let weekStartDate = rest.week_start_date ?? null;
    const weekAssignment = rest.week_assignment ?? 'this_week';
    const tz = await getUserTimezone(request.userId);
    if (weekAssignment === 'this_week' && !weekStartDate) {
      weekStartDate = getCurrentWeekStartDate(tz);
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...rest,
        user_id: request.userId,
        week_assignment: weekAssignment,
        week_start_date: weekStartDate,
      })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });

    if (data && reminder_spec) {
      await createReminderForTask(request.userId, data.id, reminder_spec, tz);
    }

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

    await cancelRemindersForTask(request.userId, id);

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

  fastify.get('/tasks/:id/reminder', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', request.userId)
      .single();
    if (!task) return reply.status(404).send({ error: 'Task not found' });

    const { data } = await supabase
      .from('reminders')
      .select('kind, scheduled_for, recurrence_rule')
      .eq('task_id', id)
      .eq('user_id', request.userId)
      .eq('status', 'scheduled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return reply.send(data ?? null);
  });

  fastify.post('/tasks/:id/reminders', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = ReminderSpecSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    // Verify task belongs to user
    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', request.userId)
      .single();
    if (!task) return reply.status(404).send({ error: 'Task not found' });

    const tz = await getUserTimezone(request.userId);
    await cancelRemindersForTask(request.userId, id);
    await createReminderForTask(request.userId, id, parsed.data, tz);
    return reply.status(201).send({ ok: true });
  });
}
