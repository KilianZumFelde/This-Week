import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';

const RegisterTokenSchema = z.object({
  expo_push_token: z.string().min(1),
  platform: z.enum(['android', 'ios', 'web', 'unknown']).optional().default('android'),
  device_name: z.string().nullable().optional(),
});

export async function notificationsRoutes(fastify: FastifyInstance) {
  fastify.post('/notifications/register', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = RegisterTokenSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { expo_push_token, platform, device_name } = parsed.data;

    const { error } = await supabase
      .from('notification_tokens')
      .upsert(
        {
          user_id: request.userId,
          expo_push_token,
          platform,
          device_name: device_name ?? null,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'expo_push_token' }
      );

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(200).send({ ok: true });
  });

  fastify.get('/notifications/reminders', { preHandler: [authenticate] }, async (request, reply) => {
    const { data, error } = await supabase
      .from('reminders')
      .select('id, task_id, kind, status, scheduled_for, next_run_at, tasks(title)')
      .eq('user_id', request.userId)
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true });

    if (error) return reply.status(500).send({ error: error.message });
    return data ?? [];
  });

  fastify.delete('/notifications/reminders', { preHandler: [authenticate] }, async (request, reply) => {
    const { error } = await supabase
      .from('reminders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', request.userId)
      .eq('status', 'scheduled');

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(200).send({ ok: true });
  });
}
