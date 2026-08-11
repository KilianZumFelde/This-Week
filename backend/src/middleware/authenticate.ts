import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase.js';

// Token -> userId cache. Every request used to cost a network round-trip to
// Supabase Auth; the home screen fires six queries at once, so one blip took
// down the whole screen. Cache verified tokens for a short window instead.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { userId: string; expiresAt: number }>();

function cacheGet(token: string): string | null {
  const hit = cache.get(token);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(token);
    return null;
  }
  return hit.userId;
}

function cacheSet(token: string, userId: string) {
  // Bound growth — this is a single-user app, but tokens rotate.
  if (cache.size > 100) cache.clear();
  cache.set(token, { userId, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }
  const token = auth.slice(7);

  const cached = cacheGet(token);
  if (cached) {
    request.userId = cached;
    return;
  }

  let user;
  let error;
  try {
    ({ data: { user }, error } = await supabase.auth.getUser(token));
  } catch (err) {
    // Network failure reaching Supabase Auth — the service is unavailable, the
    // caller's credentials are not wrong. Returning 401 here logs the user out
    // on a transient blip.
    request.log.error({ err }, 'auth verification failed to reach Supabase');
    reply.status(503).send({ error: 'Auth service unavailable' });
    return;
  }

  if (error) {
    // Supabase distinguishes a rejected token (401/403) from its own trouble
    // (5xx, or no status at all when the request never landed).
    const status = (error as { status?: number }).status;
    if (status === undefined || status >= 500) {
      request.log.error({ err: error }, 'auth verification errored upstream');
      reply.status(503).send({ error: 'Auth service unavailable' });
      return;
    }
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }

  if (!user) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }

  cacheSet(token, user.id);
  request.userId = user.id;
}
