import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';
import { CreateMilestoneRequestSchema, UpdateMilestoneRequestSchema } from '../lib/request-schemas.js';
import { validateMilestoneDate } from '../lib/milestones.js';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function milestonesRoutes(fastify: FastifyInstance) {
  // GET /goals/:goalId/milestones — list milestones (active + hit), ordered by target_date
  fastify.get('/goals/:goalId/milestones', { preHandler: [authenticate] }, async (request, reply) => {
    const { goalId } = request.params as { goalId: string };

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', request.userId)
      .order('target_date', { ascending: true });

    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  // POST /goals/:goalId/milestones — create milestone
  fastify.post('/goals/:goalId/milestones', { preHandler: [authenticate] }, async (request, reply) => {
    const { goalId } = request.params as { goalId: string };
    const parsed = CreateMilestoneRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('target_date')
      .eq('id', goalId)
      .eq('user_id', request.userId)
      .single();

    if (goalError || !goal) return reply.status(404).send({ error: 'Goal not found.' });

    const validation = validateMilestoneDate(parsed.data.target_date, goal.target_date, todayIso());
    if (!validation.ok) return reply.status(400).send({ error: validation.reason });

    const { data, error } = await supabase
      .from('milestones')
      .insert({ ...parsed.data, goal_id: goalId, user_id: request.userId })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  // PATCH /milestones/:id — edit title or push date
  fastify.patch('/milestones/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateMilestoneRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    if (parsed.data.target_date) {
      const { data: milestone, error: mErr } = await supabase
        .from('milestones')
        .select('goal_id')
        .eq('id', id)
        .eq('user_id', request.userId)
        .single();

      if (mErr || !milestone) return reply.status(404).send({ error: 'Not found.' });

      const { data: goal, error: gErr } = await supabase
        .from('goals')
        .select('target_date')
        .eq('id', milestone.goal_id)
        .single();

      if (gErr || !goal) return reply.status(500).send({ error: 'Goal not found.' });

      const validation = validateMilestoneDate(parsed.data.target_date, goal.target_date, todayIso());
      if (!validation.ok) return reply.status(400).send({ error: validation.reason });
    }

    const { data, error } = await supabase
      .from('milestones')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Not found.' });
    return data;
  });

  // POST /milestones/:id/mark-hit — set status='hit' + hit_at=now()
  fastify.post('/milestones/:id/mark-hit', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data, error } = await supabase
      .from('milestones')
      .update({ status: 'hit', hit_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Not found.' });
    return data;
  });

  // DELETE /milestones/:id — hard delete (escape hatch)
  fastify.delete('/milestones/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id)
      .eq('user_id', request.userId);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(204).send();
  });
}
