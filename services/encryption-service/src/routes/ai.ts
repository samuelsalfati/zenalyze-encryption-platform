import type { FastifyInstance } from 'fastify';
import type { AIPrivacyService } from '../services/ai-privacy.service';
import type { AnalyzeWithAIRequest } from '../types';

const analyzeSchema = {
  body: {
    type: 'object' as const,
    required: ['encryptedData', 'prompt', 'userId'],
    properties: {
      encryptedData: {
        type: 'object' as const,
        required: ['version', 'ciphertext', 'iv', 'authTag', 'timestamp'],
        properties: {
          version: { type: 'number' as const },
          ciphertext: { type: 'string' as const, minLength: 1 },
          iv: { type: 'string' as const, minLength: 1 },
          authTag: { type: 'string' as const, minLength: 1 },
          timestamp: { type: 'number' as const },
        },
      },
      prompt: { type: 'string' as const, minLength: 1 },
      userId: { type: 'string' as const, minLength: 1 },
      provider: { type: 'string' as const, enum: ['openai', 'anthropic', 'google'] },
      model: { type: 'string' as const },
      options: { type: 'object' as const },
    },
  },
};

export async function aiRoutes(fastify: FastifyInstance) {
  // POST /v1/ai/analyze
  fastify.post('/v1/ai/analyze', { schema: analyzeSchema }, async (request) => {
    const body = request.body as AnalyzeWithAIRequest;

    const result = await fastify.aiPrivacyService.analyze(body);
    await fastify.usageService.trackUsage(request.customer!.customerId);

    return result;
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    aiPrivacyService: AIPrivacyService;
  }
}
