import { getRedis } from "./redis";

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number }> {
  try {
    const client = getRedis();
    const redisKey = `rl:${key}`;
    const count = await client.incr(redisKey);

    if (count === 1) {
      await client.pexpire(redisKey, windowMs);
    }

    if (count > maxRequests) {
      return { ok: false, remaining: 0 };
    }

    return { ok: true, remaining: maxRequests - count };
  } catch {
    // Redis unavailable — allow request (fail open)
    return { ok: true, remaining: maxRequests };
  }
}
