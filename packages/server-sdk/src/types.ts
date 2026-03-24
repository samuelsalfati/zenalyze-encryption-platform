/**
 * Configuration options for ZenalyzeServer
 */
export interface ServerConfig {
  /**
   * API key from Zenalyze platform
   */
  apiKey: string;

  /**
   * Base URL for Zenalyze API
   * @default 'https://api.zenalyze.com'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Number of retry attempts for failed requests
   * @default 3
   */
  maxRetries?: number;

  /**
   * Enable audit logging
   * @default true
   */
  enableAuditLog?: boolean;

  /**
   * Custom audit log handler
   */
  auditLogHandler?: AuditLogHandler;
}

/**
 * Encrypted data structure (from client SDK)
 */
export interface EncryptedData {
  version: number;
  ciphertext: string;
  iv: string;
  authTag: string;
  timestamp: number;
}

/**
 * Request to store encrypted data
 */
export interface StoreEncryptedRequest {
  /**
   * User ID who owns the data
   */
  userId: string;

  /**
   * Encrypted data payload
   */
  encryptedData: EncryptedData;

  /**
   * Optional metadata (not encrypted)
   */
  metadata?: Record<string, any>;
}

/**
 * Response from storing encrypted data
 */
export interface StoreEncryptedResponse {
  /**
   * Unique ID for the stored data
   */
  dataId: string;

  /**
   * Timestamp when stored
   */
  storedAt: number;

  /**
   * Storage status
   */
  status: 'success' | 'error';
}

/**
 * Request to fetch encrypted data
 */
export interface FetchEncryptedRequest {
  /**
   * Unique ID of the data to fetch
   */
  dataId: string;

  /**
   * User ID (for access control)
   */
  userId: string;
}

/**
 * Response from fetching encrypted data
 */
export interface FetchEncryptedResponse {
  /**
   * The encrypted data
   */
  encryptedData: EncryptedData;

  /**
   * Metadata
   */
  metadata?: Record<string, any>;

  /**
   * When the data was originally stored
   */
  storedAt: number;
}

/**
 * Request to analyze encrypted data with AI
 */
export interface AnalyzeWithAIRequest {
  /**
   * Encrypted data to analyze
   */
  encryptedData: EncryptedData;

  /**
   * AI prompt/instructions
   */
  prompt: string;

  /**
   * AI provider to use
   * @default 'openai'
   */
  provider?: 'openai' | 'anthropic' | 'google';

  /**
   * Model to use (provider-specific)
   */
  model?: string;

  /**
   * User ID (for audit logging)
   */
  userId: string;

  /**
   * Additional options
   */
  options?: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}

/**
 * Response from AI analysis
 */
export interface AnalyzeWithAIResponse {
  /**
   * Encrypted AI response
   */
  encryptedResponse: EncryptedData;

  /**
   * AI provider used
   */
  provider: string;

  /**
   * Model used
   */
  model: string;

  /**
   * Tokens used (for billing)
   */
  tokensUsed?: number;

  /**
   * Processing time in milliseconds
   */
  processingTime: number;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  /**
   * Timestamp of the operation
   */
  timestamp: number;

  /**
   * Operation performed
   */
  operation: 'store' | 'fetch' | 'analyze' | 'delete';

  /**
   * User ID who performed the operation
   */
  userId: string;

  /**
   * Data ID (if applicable)
   */
  dataId?: string;

  /**
   * Operation result
   */
  result: 'success' | 'error';

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;

  /**
   * IP address (if available)
   */
  ipAddress?: string;

  /**
   * User agent (if available)
   */
  userAgent?: string;
}

/**
 * Custom audit log handler function
 */
export type AuditLogHandler = (entry: AuditLogEntry) => void | Promise<void>;

/**
 * Usage statistics
 */
export interface UsageStats {
  /**
   * API calls this month
   */
  apiCallsThisMonth: number;

  /**
   * API calls today
   */
  apiCallsToday: number;

  /**
   * Tier limit
   */
  tierLimit: number;

  /**
   * Current tier
   */
  tier: 'free' | 'starter' | 'professional' | 'business' | 'enterprise';

  /**
   * Overage charges
   */
  overageCharges: number;
}

/**
 * API Error response
 */
export interface APIError {
  /**
   * Error code
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * Additional error details
   */
  details?: Record<string, any>;
}

/**
 * Server SDK Error class
 */
export class ZenalyzeServerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ZenalyzeServerError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends ZenalyzeServerError {
  constructor(
    public readonly retryAfter: number,
    message = 'Rate limit exceeded'
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends ZenalyzeServerError {
  constructor(message = 'Invalid API key') {
    super(message, 'AUTHENTICATION_FAILED', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends ZenalyzeServerError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}
