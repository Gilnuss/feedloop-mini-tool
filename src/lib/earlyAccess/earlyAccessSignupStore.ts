/**
 * Storage for early-access signups.
 *
 * ⚠️ PRIVACY POSTURE CHANGE — read before extending this file.
 * Every other store in this app is deliberately anonymous: lib/events.ts keeps
 * an opaque session id and an event name and says so in its header. This module
 * is the first place FeedLoop Decode holds PII. That means:
 *   - signups live under their own key prefix, never joined to a session id,
 *     so the funnel cannot be de-anonymised by cross-referencing the two
 *   - the feedback text a visitor pasted is still never stored with them
 *   - a privacy notice next to the form is now load-bearing, not decorative
 * Before launch this needs a retention decision and a deletion path.
 *
 * Its own Redis client rather than one borrowed from lib/events.ts: that module
 * memoizes a connection tuned for high-frequency fire-and-forget counters, and
 * a lead capture must not inherit its "drop it silently" failure posture.
 */

import { Redis } from "@upstash/redis";

const SIGNUPS_BY_EMAIL_KEY = "feedloop-decode:early-access:signups";
const COUNTS_BY_SOURCE_KEY = "feedloop-decode:early-access:by-source";

export interface StoredEarlyAccessSignup {
  feedbackSourceId: string;
  signedUpAt: string;
}

let memoizedRedisClient: Redis | null = null;
let hasCheckedRedisEnvironment = false;

function connectToRedisIfConfigured(): Redis | null {
  if (hasCheckedRedisEnvironment) return memoizedRedisClient;
  hasCheckedRedisEnvironment = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log("[earlyAccess] No Upstash env vars — signups held in memory (dev only)");
    return null;
  }

  memoizedRedisClient = new Redis({ url, token });
  return memoizedRedisClient;
}

/**
 * Dev-only fallback. Unlike the funnel counters, losing these on restart loses
 * actual leads — which is exactly why Upstash is required in production.
 */
const signupsHeldInMemory = new Map<string, StoredEarlyAccessSignup>();

/**
 * Returns true when this email had not signed up before.
 *
 * Re-submitting is not an error — someone changing their answer should not see
 * a failure — but it must not inflate the per-source counts that decide the
 * integration roadmap.
 */
export async function saveEarlyAccessSignup(
  emailAddress: string,
  feedbackSourceId: string,
): Promise<{ isFirstTimeSignup: boolean }> {
  const signup: StoredEarlyAccessSignup = {
    feedbackSourceId,
    signedUpAt: new Date().toISOString(),
  };

  const redisClient = connectToRedisIfConfigured();

  if (!redisClient) {
    const isFirstTimeSignup = !signupsHeldInMemory.has(emailAddress);
    signupsHeldInMemory.set(emailAddress, signup);
    return { isFirstTimeSignup };
  }

  // HSETNX so a second submission cannot overwrite the original signup time,
  // and so the source counter below is incremented exactly once per person.
  const wasWritten = await redisClient.hsetnx(
    SIGNUPS_BY_EMAIL_KEY,
    emailAddress,
    JSON.stringify(signup),
  );

  const isFirstTimeSignup = wasWritten === 1;
  if (isFirstTimeSignup) {
    await redisClient.hincrby(COUNTS_BY_SOURCE_KEY, feedbackSourceId, 1);
  }

  return { isFirstTimeSignup };
}

export async function countTotalEarlyAccessSignups(): Promise<number> {
  const redisClient = connectToRedisIfConfigured();
  if (!redisClient) return signupsHeldInMemory.size;

  return await redisClient.hlen(SIGNUPS_BY_EMAIL_KEY);
}

/**
 * The integration roadmap, ordered by demand. Read this before deciding which
 * intake source to build next.
 */
export async function readSignupCountsByFeedbackSource(): Promise<Record<string, number>> {
  const redisClient = connectToRedisIfConfigured();

  if (!redisClient) {
    const counts: Record<string, number> = {};
    for (const signup of signupsHeldInMemory.values()) {
      counts[signup.feedbackSourceId] = (counts[signup.feedbackSourceId] || 0) + 1;
    }
    return counts;
  }

  const stored = await redisClient.hgetall<Record<string, string | number>>(COUNTS_BY_SOURCE_KEY);
  if (!stored) return {};

  const counts: Record<string, number> = {};
  for (const [sourceId, rawCount] of Object.entries(stored)) {
    counts[sourceId] = Number(rawCount) || 0;
  }
  return counts;
}
