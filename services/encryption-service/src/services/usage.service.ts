import type Redis from 'ioredis';
import type { CustomerTier, UsageStats } from '../types';

const TIER_MONTHLY_LIMITS: Record<CustomerTier, number> = {
  free: 3000,       // 100/day
  starter: 10000,
  professional: 100000,
  business: 300000,
  enterprise: Infinity,
};

export class UsageService {
  constructor(private redis: Redis | null) {}

  async trackUsage(customerId: string): Promise<void> {
    if (!this.redis) return;

    const now = new Date();
    const monthKey = `usage:${customerId}:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const dayKey = `usage:${customerId}:${now.toISOString().slice(0, 10)}`;

    const pipeline = this.redis.pipeline();
    pipeline.incr(monthKey);
    pipeline.expire(monthKey, 86400 * 35); // 35 days TTL
    pipeline.incr(dayKey);
    pipeline.expire(dayKey, 86400 * 2); // 2 days TTL

    try {
      await pipeline.exec();
    } catch {
      // Fail silently — usage tracking is non-critical
    }
  }

  async getUsage(customerId: string, tier: CustomerTier): Promise<UsageStats> {
    if (!this.redis) {
      return {
        apiCallsThisMonth: 0,
        apiCallsToday: 0,
        tierLimit: TIER_MONTHLY_LIMITS[tier],
        tier,
        overageCharges: 0,
      };
    }

    const now = new Date();
    const monthKey = `usage:${customerId}:${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const dayKey = `usage:${customerId}:${now.toISOString().slice(0, 10)}`;

    try {
      const [monthCount, dayCount] = await this.redis.mget(monthKey, dayKey);

      return {
        apiCallsThisMonth: parseInt(monthCount || '0', 10),
        apiCallsToday: parseInt(dayCount || '0', 10),
        tierLimit: TIER_MONTHLY_LIMITS[tier],
        tier,
        overageCharges: 0,
      };
    } catch {
      return {
        apiCallsThisMonth: 0,
        apiCallsToday: 0,
        tierLimit: TIER_MONTHLY_LIMITS[tier],
        tier,
        overageCharges: 0,
      };
    }
  }
}
