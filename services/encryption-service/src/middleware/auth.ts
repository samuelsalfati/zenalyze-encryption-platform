import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ApiKeyEntry } from '../types';

export function createAuthHook(apiKeys: Record<string, ApiKeyEntry>) {
  return async function authHook(request: FastifyRequest, reply: FastifyReply) {
    // Skip auth for health checks
    if (request.url === '/health' || request.url === '/v1/health') {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        code: 'AUTHENTICATION_FAILED',
        message: 'Missing or invalid Authorization header',
        statusCode: 401,
      });
    }

    const apiKey = authHeader.slice(7); // Remove "Bearer "
    const keyEntry = apiKeys[apiKey];

    if (!keyEntry) {
      return reply.status(401).send({
        code: 'AUTHENTICATION_FAILED',
        message: 'Invalid API key',
        statusCode: 401,
      });
    }

    request.customer = {
      customerId: keyEntry.customerId,
      tier: keyEntry.tier,
      name: keyEntry.name,
      apiKey,
    };
  };
}
