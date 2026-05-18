import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';
import { CreateHabitRequestSchema, UpdateHabitRequestSchema } from '../lib/request-schemas.js';
import { getCurrentWeekStartDate } from '../lib/week.js';

async function getUserTimezone(userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_settings')
    .select('timezone')
    .eq('user_id', userId)
    .single();
  return data?.timezone ?? 'UTC';
}

export async function habitsRoutes(fastify: FastifyInstance) {
  // GET /habits/week-records?week_start_date=YYYY-MM-DD — all records for the given week
  fastify.get('/habits/week-records', { preHandler: [authenticate] }, async (request, reply) => {
    const tz = await getUserTimezone(request.userId);
    const { week_start_date } = request.query as { week_start_date?: string };
    const weekDate = week_start_date ?? getCurrentWeekStartDate(tz);

    const { data, error } = await supabase
      .from('habit_week_records')
      .select('*')
      .eq('user_id', request.userId)
      .eq('week_start_date', weekDate);

    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  fastify.get('/habits', { preHandler: [authenticate] }, async (request, reply) => {
    const { status } = (request.query as { status?: string });

    let query = supabase
      .from('habits')
      .select('*')
      .eq('user_id', request.userId)
      .order('sort_order', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    } else {
      // Default: return active + paused (exclude archived only)
      query = query.neq('status', 'archived');
    }

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  fastify.post('/habits', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = CreateHabitRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const body = parsed.data;
    const tz = await getUserTimezone(request.userId);
    const weekStartDate = getCurrentWeekStartDate(tz);

    // Insert habit and its first week record atomically via sequential queries
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .insert({ ...body, user_id: request.userId })
      .select()
      .single();

    if (habitError) return reply.status(500).send({ error: habitError.message });

    const { error: recordError } = await supabase.from('habit_week_records').insert({
      user_id: request.userId,
      habit_id: habit.id,
      week_start_date: weekStartDate,
      target_count: body.weekly_target,
      completed_count: 0,
    });

    if (recordError) {
      // Roll back: delete habit
      await supabase.from('habits').delete().eq('id', habit.id);
      return reply.status(500).send({ error: recordError.message });
    }

    return reply.status(201).send(habit);
  });

  fastify.patch('/habits/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateHabitRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'archived') {
      updates.archived_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Not found' });
    return data;
  });

  fastify.delete('/habits/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Hard delete: cascades to habit_week_records via FK
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', request.userId);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(204).send();
  });

  fastify.post('/habits/:id/increment', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tz = await getUserTimezone(request.userId);
    const weekStartDate = getCurrentWeekStartDate(tz);

    // Upsert record for current week, then increment
    const { data: record, error: fetchError } = await supabase
      .from('habit_week_records')
      .select('id, completed_count, target_count')
      .eq('habit_id', id)
      .eq('week_start_date', weekStartDate)
      .single();

    if (fetchError || !record) {
      // No record for this week yet — create one with completed_count=1
      const { data: habit } = await supabase
        .from('habits')
        .select('weekly_target')
        .eq('id', id)
        .eq('user_id', request.userId)
        .single();

      const { data: created, error: createError } = await supabase
        .from('habit_week_records')
        .insert({
          user_id: request.userId,
          habit_id: id,
          week_start_date: weekStartDate,
          target_count: habit?.weekly_target ?? 1,
          completed_count: 1,
        })
        .select()
        .single();

      if (createError) return reply.status(500).send({ error: createError.message });
      return created;
    }

    const { data: updated, error: updateError } = await supabase
      .from('habit_week_records')
      .update({ completed_count: record.completed_count + 1 })
      .eq('id', record.id)
      .select()
      .single();

    if (updateError) return reply.status(500).send({ error: updateError.message });
    return updated;
  });
}
