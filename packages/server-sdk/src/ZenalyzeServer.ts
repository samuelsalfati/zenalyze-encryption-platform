import { APIClient } from './APIClient';
import { AuditLogger } from './AuditLogger';
import type {
  ServerConfig,
  EncryptedData,
  StoreEncryptedRequest,
  StoreEncryptedResponse,
  FetchEncryptedRequest,
  FetchEncryptedResponse,
  AnalyzeWithAIRequest,
  AnalyzeWithAIResponse,
  UsageStats
} from './types';
import { ValidationError } from './types';

/**
 * Server-side SDK for Zenalyze Encryption Platform
 *
 * Features:
 * - Store and fetch encrypted data
 * - Send encrypted data to AI Privacy Service
 * - Automatic HIPAA audit logging
 * - Retry logic for failed requests
 * - TypeScript types included
 *
 * @example
 * ```typescript
 * const server = new ZenalyzeServer({
 *   apiKey: process.env.ZENALYZE_API_KEY
 * });
 *
 * // Store encrypted data
 * await server.storeEncrypted({
 *   userId: 'user123',
 *   encryptedData: clientEncryptedData
 * });
 *
 * // Analyze with AI
 * const aiResponse = await server.analyzeWithAI({
 *   encryptedData: clientEncryptedData,
 *   prompt: 'Analyze this mental health assessment',
 *   userId: 'user123'
 * });
 * ```
 */
export class ZenalyzeServer {
  private client: APIClient;
  private auditLogger: AuditLogger;
  private config: Required<ServerConfig>;

  constructor(config: ServerConfig) {
    // Validate config
    if (!config.apiKey) {
      throw new ValidationError('API key is required');
    }

    // Set defaults
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.zenalyze.com',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      enableAuditLog: config.enableAuditLog !== false,
      auditLogHandler: config.auditLogHandler
    };

    // Initialize components
    this.client = new APIClient({
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries
    });

    this.auditLogger = new AuditLogger(
      this.config.auditLogHandler,
      this.config.enableAuditLog
    );
  }

  /**
   * Store encrypted data
   *
   * The server CANNOT decrypt this data - it's stored as an opaque blob.
   * Only the client with the correct password can decrypt it.
   *
   * @param request - Store request with userId and encrypted data
   * @returns Response with dataId and timestamp
   *
   * @example
   * ```typescript
   * const response = await server.storeEncrypted({
   *   userId: 'user123',
   *   encryptedData: {
   *     version: 1,
   *     ciphertext: 'aB3xK...',
   *     iv: 'rT2v...',
   *     authTag: 'mZ9w...',
   *     timestamp: Date.now()
   *   },
   *   metadata: {
   *     type: 'journal_entry',
   *     tags: ['anxiety', 'mood']
   *   }
   * });
   *
   * console.log(response.dataId); // 'data_abc123'
   * ```
   */
  async storeEncrypted(
    request: StoreEncryptedRequest
  ): Promise<StoreEncryptedResponse> {
    // Validate request
    this.validateEncryptedData(request.encryptedData);

    try {
      const response = await this.client.post<StoreEncryptedResponse>(
        '/v1/data/store',
        request
      );

      // Audit log (success)
      await this.auditLogger.logSuccess(
        'store',
        request.userId,
        response.dataId,
        { metadata: request.metadata }
      );

      return response;
    } catch (error) {
      // Audit log (error)
      await this.auditLogger.logError(
        'store',
        request.userId,
        error as Error,
        undefined,
        { metadata: request.metadata }
      );

      throw error;
    }
  }

  /**
   * Fetch encrypted data by ID
   *
   * The server returns encrypted data - it still cannot read it.
   * Client must decrypt with the correct password.
   *
   * @param request - Fetch request with dataId and userId
   * @returns Encrypted data and metadata
   *
   * @example
   * ```typescript
   * const response = await server.fetchEncrypted({
   *   dataId: 'data_abc123',
   *   userId: 'user123'
   * });
   *
   * // Send encrypted data to client for decryption
   * res.json(response.encryptedData);
   * ```
   */
  async fetchEncrypted(
    request: FetchEncryptedRequest
  ): Promise<FetchEncryptedResponse> {
    try {
      const response = await this.client.get<FetchEncryptedResponse>(
        `/v1/data/${request.dataId}`,
        {
          params: { userId: request.userId }
        }
      );

      // Audit log (success)
      await this.auditLogger.logSuccess(
        'fetch',
        request.userId,
        request.dataId
      );

      return response;
    } catch (error) {
      // Audit log (error)
      await this.auditLogger.logError(
        'fetch',
        request.userId,
        error as Error,
        request.dataId
      );

      throw error;
    }
  }

  /**
   * Analyze encrypted data with AI
   *
   * This is where the magic happens:
   * 1. Server sends encrypted data to AI Privacy Service (Nitro Enclave)
   * 2. Enclave temporarily decrypts data (<100ms)
   * 3. Sends plaintext to AI (OpenAI, Anthropic, etc.)
   * 4. Re-encrypts AI response
   * 5. Destroys plaintext from memory
   * 6. Returns encrypted AI response
   *
   * The server NEVER sees the plaintext - only the Nitro Enclave does,
   * and only for ~50-100ms in hardware-isolated memory.
   *
   * @param request - AI analysis request
   * @returns Encrypted AI response
   *
   * @example
   * ```typescript
   * const response = await server.analyzeWithAI({
   *   encryptedData: clientEncryptedData,
   *   prompt: 'Analyze this journal entry for mood',
   *   userId: 'user123',
   *   provider: 'openai',
   *   model: 'gpt-4'
   * });
   *
   * // Send encrypted AI response back to client
   * res.json(response.encryptedResponse);
   * ```
   */
  async analyzeWithAI(
    request: AnalyzeWithAIRequest
  ): Promise<AnalyzeWithAIResponse> {
    // Validate request
    this.validateEncryptedData(request.encryptedData);

    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new ValidationError('AI prompt is required');
    }

    try {
      const response = await this.client.post<AnalyzeWithAIResponse>(
        '/v1/ai/analyze',
        {
          encryptedData: request.encryptedData,
          prompt: request.prompt,
          provider: request.provider || 'openai',
          model: request.model,
          options: request.options
        }
      );

      // Audit log (success)
      await this.auditLogger.logSuccess(
        'analyze',
        request.userId,
        undefined,
        {
          provider: response.provider,
          model: response.model,
          tokensUsed: response.tokensUsed,
          processingTime: response.processingTime
        }
      );

      return response;
    } catch (error) {
      // Audit log (error)
      await this.auditLogger.logError(
        'analyze',
        request.userId,
        error as Error,
        undefined,
        {
          provider: request.provider,
          model: request.model
        }
      );

      throw error;
    }
  }

  /**
   * Delete encrypted data
   *
   * Permanently removes data from storage.
   * This operation cannot be undone.
   *
   * @param dataId - ID of data to delete
   * @param userId - User ID (for authorization)
   *
   * @example
   * ```typescript
   * await server.deleteEncrypted('data_abc123', 'user123');
   * ```
   */
  async deleteEncrypted(dataId: string, userId: string): Promise<void> {
    try {
      await this.client.delete(`/v1/data/${dataId}`, {
        params: { userId }
      });

      // Audit log (success)
      await this.auditLogger.logSuccess('delete', userId, dataId);
    } catch (error) {
      // Audit log (error)
      await this.auditLogger.logError(
        'delete',
        userId,
        error as Error,
        dataId
      );

      throw error;
    }
  }

  /**
   * Get usage statistics
   *
   * Returns API usage for billing and monitoring.
   *
   * @returns Usage statistics
   *
   * @example
   * ```typescript
   * const stats = await server.getUsage();
   * console.log(`Used ${stats.apiCallsThisMonth} of ${stats.tierLimit} calls`);
   * ```
   */
  async getUsage(): Promise<UsageStats> {
    return this.client.get<UsageStats>('/v1/usage');
  }

  /**
   * Health check
   *
   * Verifies API key is valid and service is reachable.
   *
   * @returns True if healthy
   *
   * @example
   * ```typescript
   * const isHealthy = await server.healthCheck();
   * if (!isHealthy) {
   *   console.error('Zenalyze API is down!');
   * }
   * ```
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/v1/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate encrypted data structure
   */
  private validateEncryptedData(data: EncryptedData): void {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Encrypted data must be an object');
    }

    if (typeof data.version !== 'number') {
      throw new ValidationError('Encrypted data version must be a number');
    }

    if (typeof data.ciphertext !== 'string' || data.ciphertext.length === 0) {
      throw new ValidationError('Encrypted data ciphertext must be a non-empty string');
    }

    if (typeof data.iv !== 'string' || data.iv.length === 0) {
      throw new ValidationError('Encrypted data IV must be a non-empty string');
    }

    if (typeof data.authTag !== 'string' || data.authTag.length === 0) {
      throw new ValidationError('Encrypted data authTag must be a non-empty string');
    }

    if (typeof data.timestamp !== 'number') {
      throw new ValidationError('Encrypted data timestamp must be a number');
    }
  }

  /**
   * Set custom audit log handler
   *
   * Use this to integrate with your logging system (CloudWatch, Datadog, etc.)
   *
   * @param handler - Custom audit log handler function
   *
   * @example
   * ```typescript
   * server.setAuditLogHandler(async (entry) => {
   *   await cloudwatch.putLogEvents({
   *     logGroupName: '/zenalyze/audit',
   *     logStreamName: 'production',
   *     logEvents: [{
   *       timestamp: entry.timestamp,
   *       message: JSON.stringify(entry)
   *     }]
   *   });
   * });
   * ```
   */
  setAuditLogHandler(handler: Required<ServerConfig>['auditLogHandler']): void {
    if (handler) {
      this.auditLogger.setHandler(handler);
    }
  }

  /**
   * Enable or disable audit logging
   *
   * @param enabled - Whether to enable audit logging
   */
  setAuditLogEnabled(enabled: boolean): void {
    this.auditLogger.setEnabled(enabled);
  }
}
