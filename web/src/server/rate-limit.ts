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

    // INCR + PEXPIRE atomically in a single round-trip so a process crash
    // between the two commands cannot leave a permanent key (never resets).
    const [[, rawCount]] = (await client
      .multi()
      .incr(redisKey)
      .pexpire(redisKey, windowMs, "NX")
      .exec()) as [[Error | null, number], [Error | null, number]];

    const count = Number(rawCount);
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
