import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';
import { CreateThemeRequestSchema, UpdateThemeRequestSchema } from '../lib/request-schemas.js';

export async function themesRoutes(fastify: FastifyInstance) {
  fastify.get('/themes', { preHandler: [authenticate] }, async (request, reply) => {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('user_id', request.userId)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true });

    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  fastify.post('/themes', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = CreateThemeRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { data, error } = await supabase
      .from('themes')
      .insert({ ...parsed.data, user_id: request.userId })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  fastify.patch('/themes/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateThemeRequestSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { data, error } = await supabase
      .from('themes')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', request.userId)
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    if (!data) return reply.status(404).send({ error: 'Not found' });
    return data;
  });

  fastify.delete('/themes/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Prevent deletion if referenced by active tasks or habits
    const [tasksResult, habitsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('theme_id', id)
        .eq('user_id', request.userId)
        .neq('status', 'archived_done'),
      supabase
        .from('habits')
        .select('id', { count: 'exact', head: true })
        .eq('theme_id', id)
        .eq('user_id', request.userId)
        .neq('status', 'archived'),
    ]);

    if ((tasksResult.count ?? 0) > 0 || (habitsResult.count ?? 0) > 0) {
      return reply.status(400).send({
        error: 'Cannot delete theme with active tasks or habits. Archive them first.',
      });
    }

    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', id)
      .eq('user_id', request.userId);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(204).send();
  });
}
