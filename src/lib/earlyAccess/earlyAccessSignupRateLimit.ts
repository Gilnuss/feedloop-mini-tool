/**
 * Rate limit for early-access signups, on its own budget.
 *
 * Kept apart from lib/rateLimit.ts for the same reason the funnel events have
 * their own limiter: a shared budget lets one kind of traffic starve another.
 * Nobody should be unable to hand over their email because they spent the hour
 * decoding feedback — that is the exact moment they are most worth capturing.
 *
 * It also FAILS CLOSED, which is the opposite of every other limiter here.
 * Decode and event limiters fail open because dropping them costs a metric or
 * a run. This endpoint writes PII into permanent storage, so when Redis is
 * unreachable the safe answer is to refuse rather than to let an unbounded
 * write through unmetered.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Low on purpose. One person signs up once; anything above a handful an hour
 * from a single address is a script, not a cohort.
 */
const MAX_SIGNUPS_PER_HOUR_PER_IP = 5;

let memoizedSignupRatelimit: Ratelimit | null = null;
let hasCheckedRedisEnvironment = false;

function connectToSignupRatelimitIfConfigured(): Ratelimit | null {
  if (hasCheckedRedisEnvironment) return memoizedSignupRatelimit;
  hasCheckedRedisEnvironment = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log("[earlyAccess] No Upstash env vars — signup limiter in memory (dev only)");
    return null;
  }

  memoizedSignupRatelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_SIGNUPS_PER_HOUR_PER_IP, "1 h"),
    analytics: false,
    prefix: "feedloop-early-access",
  });

  return memoizedSignupRatelimit;
}

const signupAttemptsHeldInMemory = new Map<string, { count: number; resetAt: number }>();

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

function isWithinInMemorySignupAllowance(clientIp: string): boolean {
  const now = Date.now();
  let attempts = signupAttemptsHeldInMemory.get(clientIp);

  if (!attempts || now > attempts.resetAt) {
    attempts = { count: 0, resetAt: now + ONE_HOUR_IN_MS };
    signupAttemptsHeldInMemory.set(clientIp, attempts);
  }

  if (attempts.count >= MAX_SIGNUPS_PER_HOUR_PER_IP) return false;

  attempts.count++;
  return true;
}

export async function isSignupAllowedForClient(clientIp: string): Promise<boolean> {
  const ratelimit = connectToSignupRatelimitIfConfigured();
  if (!ratelimit) return isWithinInMemorySignupAllowance(clientIp);

  try {
    const { success } = await ratelimit.limit(clientIp);
    return success;
  } catch (err) {
    console.error("[earlyAccess] Signup limiter unavailable — refusing:", err);
    return false;
  }
}

export function describeSignupRateLimitRefusal(): string {
  return `Too many signups from this connection. Try again in an hour, or email us directly.`;
}
