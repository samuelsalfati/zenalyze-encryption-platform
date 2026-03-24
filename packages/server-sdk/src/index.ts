/**
 * @zenalyze/server-sdk
 *
 * Server-side SDK for Zenalyze Encryption Platform
 *
 * Features:
 * - Store and fetch encrypted data (server can't decrypt!)
 * - AI analysis on encrypted data (Nitro Enclave privacy)
 * - Automatic HIPAA audit logging
 * - Retry logic and error handling
 * - TypeScript support
 *
 * @example
 * ```typescript
 * import { ZenalyzeServer } from '@zenalyze/server-sdk';
 *
 * const server = new ZenalyzeServer({
 *   apiKey: process.env.ZENALYZE_API_KEY
 * });
 *
 * // Store encrypted data (server can't read it!)
 * const stored = await server.storeEncrypted({
 *   userId: 'user123',
 *   encryptedData: clientEncryptedData
 * });
 *
 * // AI analysis (happens in secure Nitro Enclave)
 * const aiResponse = await server.analyzeWithAI({
 *   encryptedData: clientEncryptedData,
 *   prompt: 'Analyze this health data',
 *   userId: 'user123'
 * });
 * ```
 */

export { ZenalyzeServer } from './ZenalyzeServer';
export { AuditLogger } from './AuditLogger';
export { APIClient } from './APIClient';

export type {
  ServerConfig,
  EncryptedData,
  StoreEncryptedRequest,
  StoreEncryptedResponse,
  FetchEncryptedRequest,
  FetchEncryptedResponse,
  AnalyzeWithAIRequest,
  AnalyzeWithAIResponse,
  AuditLogEntry,
  AuditLogHandler,
  UsageStats,
  APIError
} from './types';

export {
  ZenalyzeServerError,
  RateLimitError,
  AuthenticationError,
  ValidationError
} from './types';
