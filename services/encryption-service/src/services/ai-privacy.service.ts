import type { AnalyzeWithAIRequest, AnalyzeWithAIResponse } from '../types';
import { randomBytes } from 'crypto';

/**
 * Mock AI Privacy Service.
 * In production, this proxies to a real AWS Nitro Enclave.
 * For now it returns a realistic-looking mock response.
 */
export class AIPrivacyService {
  async analyze(request: AnalyzeWithAIRequest): Promise<AnalyzeWithAIResponse> {
    const start = Date.now();

    // Simulate enclave processing latency (50-150ms)
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    const processingTime = Date.now() - start;

    return {
      encryptedResponse: {
        version: 1,
        ciphertext: randomBytes(64).toString('base64'),
        iv: randomBytes(12).toString('base64'),
        authTag: randomBytes(16).toString('base64'),
        timestamp: Date.now(),
      },
      provider: request.provider || 'openai',
      model: request.model || 'gpt-4',
      tokensUsed: 100 + Math.floor(Math.random() * 200),
      processingTime,
    };
  }
}
