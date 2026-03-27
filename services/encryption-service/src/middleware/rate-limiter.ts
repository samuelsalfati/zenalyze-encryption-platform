import type { FastifyRequest, FastifyReply } from 'fastify';
import type Redis from 'ioredis';
import type { CustomerTier } from '../types';

const DAILY_LIMITS: Record<CustomerTier, number> = {
  free: 100,
  starter: 333,
  professional: 3333,
  business: 10000,
  enterprise: Infinity,
};

export function createRateLimitHook(redis: Redis | null) {
  return async function rateLimitHook(request: FastifyRequest, reply: FastifyReply) {
    // Skip rate limiting for health/usage checks and when no auth context
    if (request.url === '/health' || request.url === '/v1/health' || request.url === '/v1/usage') {
      return;
    }
    if (!request.customer) return;
    if (!redis) return; // Fail open if Redis is unavailable

    const { customerId, tier } = request.customer;
    const limit = DAILY_LIMITS[tier];
    if (limit === Infinity) return;

    const today = new Date().toISOString().slice(0, 10);
    const key = `ratelimit:${customerId}:${today}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, 86400);
      }

      const remaining = Math.max(0, limit - count);

      reply.header('X-RateLimit-Limit', limit);
      reply.header('X-RateLimit-Remaining', remaining);

      if (count > limit) {
        // Seconds until midnight UTC
        const now = new Date();
        const midnight = new Date(now);
        midnight.setUTCDate(midnight.getUTCDate() + 1);
        midnight.setUTCHours(0, 0, 0, 0);
        const retryAfter = Math.ceil((midnight.getTime() - now.getTime()) / 1000);

        reply.header('Retry-After', retryAfter);
        return reply.status(429).send({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          statusCode: 429,
          details: { retryAfter },
        });
      }
    } catch {
      // Fail open if Redis errors
    }
  };
}
