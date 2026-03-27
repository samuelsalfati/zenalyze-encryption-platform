import Redis from 'ioredis';

export function createRedisClient(url: string): Redis | null {
  try {
    const redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('[redis] connection error:', err.message);
    });

    redis.connect().catch(() => {
      console.warn('[redis] failed to connect, rate limiting and usage tracking disabled');
    });

    return redis;
  } catch {
    console.warn('[redis] failed to create client, rate limiting and usage tracking disabled');
    return null;
  }
}
