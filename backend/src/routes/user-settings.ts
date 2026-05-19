import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';

const UpdateUserSettingsSchema = z.object({
  danger_zone_nudges_enabled: z.boolean().optional(),
  theme_mode: z.enum(['dark', 'light', 'system']).optional(),
  timezone: z.string().optional(),
});

export async function userSettingsRoutes(fastify: FastifyInstance) {
  fastify.get('/user-settings', { preHandler: [authenticate] }, async (request, reply) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', request.userId)
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Settings not found' });
    return data;
  });

  fastify.patch('/user-settings', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = UpdateUserSettingsSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { data, error } = await supabase
      .from('user_settings')
      .update(parsed.data)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Settings not found' });
    return data;
  });
}
