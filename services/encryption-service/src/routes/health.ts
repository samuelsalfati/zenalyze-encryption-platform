import type { FastifyInstance } from 'fastify';
import type Redis from 'ioredis';

export async function healthRoutes(fastify: FastifyInstance) {
  const healthHandler = async () => {
    let redisStatus = 'disconnected';
    if (fastify.redis) {
      try {
        await fastify.redis.ping();
        redisStatus = 'connected';
      } catch {
        redisStatus = 'error';
      }
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      services: { redis: redisStatus },
    };
  };

  // Register at both paths (SDK calls /v1/health, spec says /health)
  fastify.get('/health', healthHandler);
  fastify.get('/v1/health', healthHandler);
}

// Augment Fastify with our decorated services
declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis | null;
  }
}
