import Redis from 'ioredis';

export function createRedisClient(url: string): Redis | null {
  // Skip Redis entirely if pointing at localhost (won't exist in cloud deploys)
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.warn('[redis] skipping localhost Redis, rate limiting and usage tracking disabled');
    return null;
  }

  try {
    const redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
    });

    let logged = false;
    redis.on('error', (err) => {
      if (!logged) {
        console.error('[redis] connection error:', err.message);
        logged = true;
      }
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
