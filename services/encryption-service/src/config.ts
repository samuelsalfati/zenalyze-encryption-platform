import type { ApiKeyEntry } from './types';

export interface Config {
  port: number;
  host: string;
  redisUrl: string;
  logLevel: string;
  apiKeys: Record<string, ApiKeyEntry>;
}

export function loadConfig(): Config {
  const apiKeysRaw = process.env.API_KEYS;
  if (!apiKeysRaw) {
    throw new Error('API_KEYS environment variable is required');
  }

  let apiKeys: Record<string, ApiKeyEntry>;
  try {
    apiKeys = JSON.parse(apiKeysRaw);
  } catch {
    throw new Error('API_KEYS must be valid JSON');
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    logLevel: process.env.LOG_LEVEL || 'info',
    apiKeys,
  };
}
