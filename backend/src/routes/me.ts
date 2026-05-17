import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';

export async function meRoutes(fastify: FastifyInstance) {
  fastify.get('/me', { preHandler: [authenticate] }, async (request) => {
    return { userId: request.userId };
  });
}
