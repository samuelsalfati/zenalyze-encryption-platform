import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { StorageService } from '../services/storage.service';
import type { UsageService } from '../services/usage.service';

const encryptedDataSchema = {
  type: 'object' as const,
  required: ['version', 'ciphertext', 'iv', 'authTag', 'timestamp'],
  properties: {
    version: { type: 'number' as const },
    ciphertext: { type: 'string' as const, minLength: 1 },
    iv: { type: 'string' as const, minLength: 1 },
    authTag: { type: 'string' as const, minLength: 1 },
    timestamp: { type: 'number' as const },
  },
};

const storeSchema = {
  body: {
    type: 'object' as const,
    required: ['userId', 'encryptedData'],
    properties: {
      userId: { type: 'string' as const, minLength: 1 },
      encryptedData: encryptedDataSchema,
      metadata: { type: 'object' as const },
    },
  },
};

export async function dataRoutes(fastify: FastifyInstance) {
  // POST /v1/data/store
  fastify.post('/v1/data/store', { schema: storeSchema }, async (request, reply) => {
    const { userId, encryptedData, metadata } = request.body as {
      userId: string;
      encryptedData: any;
      metadata?: Record<string, unknown>;
    };

    const result = await fastify.storageService.storeData(userId, encryptedData, metadata);
    await fastify.usageService.trackUsage(request.customer!.customerId);

    return reply.status(201).send(result);
  });

  // GET /v1/data/:dataId — matches what the SDK calls
  fastify.get('/v1/data/:dataId', async (request, reply) => {
    const { dataId } = request.params as { dataId: string };
    const { userId } = request.query as { userId: string };

    if (!userId) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'userId query parameter is required',
        statusCode: 400,
      });
    }

    const result = await fastify.storageService.fetchData(dataId, userId);
    await fastify.usageService.trackUsage(request.customer!.customerId);

    return result;
  });

  // DELETE /v1/data/:dataId
  fastify.delete('/v1/data/:dataId', async (request, reply) => {
    const { dataId } = request.params as { dataId: string };
    const { userId } = request.query as { userId: string };

    if (!userId) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: 'userId query parameter is required',
        statusCode: 400,
      });
    }

    await fastify.storageService.deleteData(dataId, userId);
    await fastify.usageService.trackUsage(request.customer!.customerId);

    return reply.status(204).send();
  });
}

// Augment Fastify with our decorated services
declare module 'fastify' {
  interface FastifyInstance {
    storageService: StorageService;
    usageService: UsageService;
  }
}
