import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';
import { performRollover } from '../services/rollover.js';

async function getUserTimezone(userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_settings')
    .select('timezone')
    .eq('user_id', userId)
    .single();
  return data?.timezone ?? 'UTC';
}

export async function rolloverRoutes(fastify: FastifyInstance) {
  // POST /rollover/check — idempotent startup trigger
  // Returns whether a rollover happened and any pending ritual ID.
  fastify.post('/rollover/check', { preHandler: [authenticate] }, async (request, reply) => {
    const tz = await getUserTimezone(request.userId);
    const result = await performRollover(request.userId, tz);
    return result;
  });
}
