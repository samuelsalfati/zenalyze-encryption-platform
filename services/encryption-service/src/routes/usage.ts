import type { FastifyInstance } from 'fastify';

export async function usageRoutes(fastify: FastifyInstance) {
  // GET /v1/usage
  fastify.get('/v1/usage', async (request) => {
    const { customerId, tier } = request.customer!;
    return fastify.usageService.getUsage(customerId, tier);
  });
}
