import type { ApiKeyEntry } from './types';

export interface Config {
  port: number;
  host: string;
  databaseUrl: string;
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
    // Try JSON first, then base64-encoded JSON (for platforms that mangle curly braces)
    if (apiKeysRaw.startsWith('{')) {
      apiKeys = JSON.parse(apiKeysRaw);
    } else {
      apiKeys = JSON.parse(Buffer.from(apiKeysRaw, 'base64').toString('utf-8'));
    }
  } catch {
    throw new Error('API_KEYS must be valid JSON or base64-encoded JSON');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    databaseUrl,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    logLevel: process.env.LOG_LEVEL || 'info',
    apiKeys,
  };
}
