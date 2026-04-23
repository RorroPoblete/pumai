import { getRedis } from "./redis";
import { scoped } from "./logger";

const log = scoped("rate-limit");

export interface RateLimitOptions {
  /** When Redis is unreachable: true = deny, false = allow. Default: allow. */
  failClosed?: boolean;
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  opts: RateLimitOptions = {},
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
  } catch (err) {
    log.error({ err }, "redis_error");
    if (opts.failClosed) {
      return { ok: false, remaining: 0 };
    }
    return { ok: true, remaining: maxRequests };
  }
}
