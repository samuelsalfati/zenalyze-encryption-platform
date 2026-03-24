import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type { ServerConfig } from './types';
import {
  ZenalyzeServerError,
  RateLimitError,
  AuthenticationError,
  ValidationError
} from './types';

/**
 * HTTP client for Zenalyze API with retry logic
 */
export class APIClient {
  private client: AxiosInstance;
  private maxRetries: number;

  constructor(config: Required<Pick<ServerConfig, 'apiKey' | 'baseUrl' | 'timeout' | 'maxRetries'>>) {
    this.maxRetries = config.maxRetries;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': '@zenalyze/server-sdk/0.1.0'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  /**
   * Make GET request with retry logic
   */
  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry('GET', path, undefined, config);
  }

  /**
   * Make POST request with retry logic
   */
  async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry('POST', path, data, config);
  }

  /**
   * Make PUT request with retry logic
   */
  async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry('PUT', path, data, config);
  }

  /**
   * Make DELETE request with retry logic
   */
  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry('DELETE', path, undefined, config);
  }

  /**
   * Make request with exponential backoff retry
   */
  private async requestWithRetry<T>(
    method: string,
    path: string,
    data?: any,
    config?: AxiosRequestConfig,
    attempt = 0
  ): Promise<T> {
    try {
      const response = await this.client.request<T>({
        method,
        url: path,
        data,
        ...config
      });

      return response.data;
    } catch (error) {
      // Don't retry on client errors (4xx except 429)
      if (error instanceof AuthenticationError ||
          error instanceof ValidationError) {
        throw error;
      }

      // Retry on rate limits and server errors
      if (error instanceof RateLimitError ||
          (error instanceof ZenalyzeServerError && error.statusCode && error.statusCode >= 500)) {
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoff(attempt, error);
          await this.sleep(delay);
          return this.requestWithRetry<T>(method, path, data, config, attempt + 1);
        }
      }

      throw error;
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number, error: any): number {
    // If rate limited, respect Retry-After header
    if (error instanceof RateLimitError && error.retryAfter) {
      return error.retryAfter * 1000; // Convert to milliseconds
    }

    // Exponential backoff: 1s, 2s, 4s, 8s...
    const baseDelay = 1000;
    const maxDelay = 30000; // Max 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

    // Add jitter (random 0-25% of delay)
    const jitter = Math.random() * delay * 0.25;
    return delay + jitter;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle API errors and convert to typed errors
   */
  private handleError(error: AxiosError): never {
    // Network errors
    if (!error.response) {
      throw new ZenalyzeServerError(
        'Network error: Unable to reach Zenalyze API',
        'NETWORK_ERROR',
        0,
        { originalError: error.message }
      );
    }

    const { status, data } = error.response;

    // Rate limit (429)
    if (status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
      throw new RateLimitError(retryAfter);
    }

    // Authentication (401)
    if (status === 401) {
      throw new AuthenticationError(
        (data as any)?.message || 'Invalid API key'
      );
    }

    // Validation (400)
    if (status === 400) {
      throw new ValidationError(
        (data as any)?.message || 'Validation error',
        (data as any)?.details
      );
    }

    // Server error (5xx)
    if (status >= 500) {
      throw new ZenalyzeServerError(
        (data as any)?.message || 'Internal server error',
        'SERVER_ERROR',
        status,
        data as any
      );
    }

    // Other errors
    throw new ZenalyzeServerError(
      (data as any)?.message || 'Unknown error',
      'UNKNOWN_ERROR',
      status,
      data as any
    );
  }
}
