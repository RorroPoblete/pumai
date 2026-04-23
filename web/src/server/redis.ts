import Redis from "ioredis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    _redis.connect().catch(() => {
      _redis = null;
    });
  }
  return _redis;
}

export async function publish(channel: string, payload: unknown): Promise<void> {
  try {
    await getRedis().publish(channel, JSON.stringify(payload));
  } catch {
    // Redis unavailable — fail open
  }
}

export function createSubscriber(): Redis {
  return new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
  });
}
