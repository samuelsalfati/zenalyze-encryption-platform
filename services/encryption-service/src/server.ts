import { randomUUID } from 'crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { Config } from './config';
import { createRedisClient } from './utils/redis';
import { StorageService } from './services/storage.service';
import { UsageService } from './services/usage.service';
import { AIPrivacyService } from './services/ai-privacy.service';
import { createAuthHook } from './middleware/auth';
import { createRateLimitHook } from './middleware/rate-limiter';
import { auditLogHook } from './middleware/audit-logger';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './routes/health';
import { dataRoutes } from './routes/data';
import { aiRoutes } from './routes/ai';
import { usageRoutes } from './routes/usage';

export async function buildServer(config: Config) {
  const fastify = Fastify({
    logger: {
      level: config.logLevel,
    },
    genReqId: () => randomUUID(),
  });

  // CORS
  await fastify.register(cors, { origin: true });

  // Services
  const redis = createRedisClient(config.redisUrl);
  const storageService = new StorageService(config.databaseUrl);
  const usageService = new UsageService(redis);
  const aiPrivacyService = new AIPrivacyService();

  // Decorate fastify with services (dependency injection)
  fastify.decorate('redis', redis);
  fastify.decorate('storageService', storageService);
  fastify.decorate('usageService', usageService);
  fastify.decorate('aiPrivacyService', aiPrivacyService);

  // Middleware
  fastify.addHook('onRequest', createAuthHook(config.apiKeys));
  fastify.addHook('onRequest', createRateLimitHook(redis));
  fastify.addHook('onResponse', auditLogHook);
  fastify.setErrorHandler(errorHandler);

  // Routes
  await fastify.register(healthRoutes);
  await fastify.register(dataRoutes);
  await fastify.register(aiRoutes);
  await fastify.register(usageRoutes);

  return fastify;
}
