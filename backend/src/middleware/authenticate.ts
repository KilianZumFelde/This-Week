import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
  const token = auth.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
  request.userId = user.id;
}
