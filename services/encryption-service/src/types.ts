import type { FastifyRequest } from 'fastify';

// Re-declare types from server-sdk to avoid cross-workspace dependency.
// These must stay in sync with packages/server-sdk/src/types.ts.

export interface EncryptedData {
  version: number;
  ciphertext: string;
  iv: string;
  authTag: string;
  timestamp: number;
}

export interface StoreEncryptedRequest {
  userId: string;
  encryptedData: EncryptedData;
  metadata?: Record<string, unknown>;
}

export interface StoreEncryptedResponse {
  dataId: string;
  storedAt: number;
  status: 'success' | 'error';
}

export interface FetchEncryptedResponse {
  encryptedData: EncryptedData;
  metadata?: Record<string, unknown>;
  storedAt: number;
}

export interface AnalyzeWithAIRequest {
  encryptedData: EncryptedData;
  prompt: string;
  provider?: 'openai' | 'anthropic' | 'google';
  model?: string;
  userId: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: unknown;
  };
}

export interface AnalyzeWithAIResponse {
  encryptedResponse: EncryptedData;
  provider: string;
  model: string;
  tokensUsed?: number;
  processingTime: number;
}

export interface UsageStats {
  apiCallsThisMonth: number;
  apiCallsToday: number;
  tierLimit: number;
  tier: CustomerTier;
  overageCharges: number;
}

export interface APIErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export type CustomerTier = 'free' | 'starter' | 'professional' | 'business' | 'enterprise';

export interface CustomerContext {
  customerId: string;
  tier: CustomerTier;
  name: string;
  apiKey: string;
}

export interface ApiKeyEntry {
  customerId: string;
  tier: CustomerTier;
  name: string;
}

export interface StoredRecord {
  dataId: string;
  userId: string;
  encryptedData: EncryptedData;
  metadata?: Record<string, unknown>;
  storedAt: number;
}

// Augment Fastify request to include customer context
declare module 'fastify' {
  interface FastifyRequest {
    customer?: CustomerContext;
  }
}
