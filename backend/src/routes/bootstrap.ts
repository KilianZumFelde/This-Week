import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { supabase } from '../lib/supabase.js';

const DEFAULT_THEMES = [
  { name: 'Health', color: '#8ea076', icon: null, sort_order: 0 },
  { name: 'Career', color: '#7a90a8', icon: null, sort_order: 1 },
  { name: 'Personal', color: '#c87856', icon: null, sort_order: 2 },
  { name: 'Learning', color: '#d4b06a', icon: null, sort_order: 3 },
];

export async function bootstrapRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/bootstrap', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.userId;

    // Upsert profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ user_id: userId }, { onConflict: 'user_id' });

    if (profileError) {
      fastify.log.error(profileError, 'bootstrap: profiles upsert failed');
      reply.status(500).send({ error: 'Bootstrap failed' });
      return;
    }

    // Upsert user_settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId }, { onConflict: 'user_id' });

    if (settingsError) {
      fastify.log.error(settingsError, 'bootstrap: user_settings upsert failed');
      reply.status(500).send({ error: 'Bootstrap failed' });
      return;
    }

    // Seed default themes if user has none
    const { data: existingThemes } = await supabase
      .from('themes')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!existingThemes || existingThemes.length === 0) {
      const { error: themesError } = await supabase
        .from('themes')
        .insert(DEFAULT_THEMES.map(t => ({ ...t, user_id: userId })));

      if (themesError) {
        fastify.log.error(themesError, 'bootstrap: themes seed failed');
        reply.status(500).send({ error: 'Bootstrap failed' });
        return;
      }
    }

    return { ok: true };
  });
}
