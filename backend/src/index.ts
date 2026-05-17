import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { meRoutes } from './routes/me.js';
import { bootstrapRoutes } from './routes/bootstrap.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

// Decorate request with userId — set by authenticate middleware per-route
app.decorateRequest('userId', '');

app.get('/health', async () => {
  return { ok: true };
});

await app.register(meRoutes);
await app.register(bootstrapRoutes);

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
