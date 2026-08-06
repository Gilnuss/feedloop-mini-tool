/**
 * Funnel event tracking — innovation accounting for the decode tool.
 *
 * src/lib/analytics.ts records engineering telemetry (cost, latency, cluster
 * counts). That answers "is the pipeline cheap and fast", which is a question
 * about the build. This module answers the questions that decide pivot or
 * persevere:
 *
 *   - do people who land actually run anything?
 *   - do they run the SAMPLE (curiosity) or their OWN feedback (value signal)?
 *   - do they reach results, and does that convert to a trial click?
 *
 * Storage: Upstash Redis, bucketed by UTC day so cohorts can be compared over
 * time. Falls back to in-memory for local dev — same pattern as rateLimit.ts.
 *
 * Privacy: this module stores only an opaque random session id (sessionStorage,
 * dies with the tab) and an event name — no feedback text, no identity.
 * Note that /api/events separately passes the caller's IP to the Upstash rate
 * limiter, which keys on it, so an IP does transit the same Redis instance
 * under the `feedloop-events:*` prefix. It is never joined to a session id.
 */

import { Redis } from "@upstash/redis";

// ── Event vocabulary ──

export const EVENT_NAMES = [
  "landed",
  "ran_sample",
  "ran_own_data",
  /**
   * Input was restored from a previous visit with no recorded provenance.
   * Kept as its own bucket rather than folded into ran_own_data — an
   * unattributable run must be visible, not silently inflate the value signal.
   */
  "ran_unknown_source",
  "reached_results",
  /**
   * Outcome events. Without these, `ran_* − reached_results` conflates a
   * pipeline crash, a timeout and a rate-limit block with genuine
   * abandonment — and those imply opposite decisions. Technical failure must
   * never be read as disinterest.
   */
  "decode_failed",
  "decode_timeout",
  "rate_limited",
  "clicked_trial",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

const EVENT_SET: ReadonlySet<string> = new Set(EVENT_NAMES);

/** Guard against arbitrary strings creating unbounded Redis keys. */
export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && EVENT_SET.has(value);
}

/** Session ids are generated client-side; accept only our own shape. */
export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(value);
}

// ── Keys ──

const PREFIX = "feedloop-decode:evt";
const RETENTION_DAYS = 90;
const TTL_SECONDS = RETENTION_DAYS * 24 * 60 * 60;

/** UTC day bucket, e.g. "2026-08-01" — the cohort dimension. */
export function dayKey(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

const totalsKey = (day: string) => `${PREFIX}:totals:${day}`;
const uniqueKey = (day: string, event: EventName) => `${PREFIX}:uniq:${day}:${event}`;

// ── Redis client ──

let redis: Redis | null = null;
let redisChecked = false;

function getRedis(): Redis | null {
  if (redisChecked) return redis;
  redisChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log("[events] No Upstash env vars — using in-memory fallback (dev only)");
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// ── In-memory fallback (dev) ──

interface MemoryDay {
  totals: Map<EventName, number>;
  uniques: Map<EventName, Set<string>>;
}

const memory = new Map<string, MemoryDay>();
const MEMORY_MAX_DAYS = 14;

function memoryDay(day: string): MemoryDay {
  let entry = memory.get(day);
  if (!entry) {
    entry = { totals: new Map(), uniques: new Map() };
    memory.set(day, entry);
    // Bound growth in long-running dev servers
    if (memory.size > MEMORY_MAX_DAYS) {
      const oldest = [...memory.keys()].sort()[0];
      memory.delete(oldest);
    }
  }
  return entry;
}

// ── Write ──

/**
 * Record one funnel event. Never throws — instrumentation must not be able to
 * break a user-facing request.
 */
export async function recordEvent(event: EventName, sessionId: string): Promise<void> {
  const day = dayKey();
  const client = getRedis();

  if (!client) {
    const entry = memoryDay(day);
    entry.totals.set(event, (entry.totals.get(event) || 0) + 1);
    const set = entry.uniques.get(event) || new Set<string>();
    set.add(sessionId);
    entry.uniques.set(event, set);
    return;
  }

  try {
    // One HTTP round trip. Totals count every fire; the set counts distinct
    // sessions, which is what the funnel conversion rates are computed from.
    const pipeline = client.pipeline();
    pipeline.hincrby(totalsKey(day), event, 1);
    pipeline.sadd(uniqueKey(day, event), sessionId);
    // NX: only set the TTL when the key has none, so repeat writes within a day
    // don't pay for a redundant EXPIRE.
    pipeline.expire(totalsKey(day), TTL_SECONDS, "NX");
    pipeline.expire(uniqueKey(day, event), TTL_SECONDS, "NX");
    await pipeline.exec();
  } catch (err) {
    console.error("[events] Failed to record event:", err);
  }
}

// ── Read ──

export interface DayFunnel {
  day: string;
  /** Every fire, including repeat runs in one session. */
  totals: Record<EventName, number>;
  /** Distinct sessions per event — the basis for conversion rates. */
  unique: Record<EventName, number>;
  rates: {
    /** Of sessions that landed, how many ran anything at all. */
    landedToRun: number | null;
    /** Of sessions that ran anything, how many used their OWN feedback. */
    runToOwnData: number | null;
    /** Of sessions that ran anything, how many saw results. */
    runToResults: number | null;
    /**
     * Of sessions that ran anything, how many hit a technical failure.
     * Read this alongside runToResults: a low runToResults with a high
     * runToFailure is a bug report, not a verdict on demand.
     */
    runToFailure: number | null;
    /** Of sessions that saw results, how many clicked through to the trial. */
    resultsToTrial: number | null;
  };
}

function emptyCounts(): Record<EventName, number> {
  return EVENT_NAMES.reduce((acc, name) => {
    acc[name] = 0;
    return acc;
  }, {} as Record<EventName, number>);
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function buildRates(unique: Record<EventName, number>): DayFunnel["rates"] {
  const ranAny = unique.ran_sample + unique.ran_own_data + unique.ran_unknown_source;
  const failedAny = unique.decode_failed + unique.decode_timeout + unique.rate_limited;
  return {
    landedToRun: ratio(ranAny, unique.landed),
    runToOwnData: ratio(unique.ran_own_data, ranAny),
    runToResults: ratio(unique.reached_results, ranAny),
    runToFailure: ratio(failedAny, ranAny),
    resultsToTrial: ratio(unique.clicked_trial, unique.reached_results),
  };
}

function recentDays(count: number): string[] {
  const days: string[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    days.push(dayKey(now - i * 24 * 60 * 60 * 1000));
  }
  return days.reverse();
}

/**
 * Read the funnel for the last `days` UTC days, oldest first.
 *
 * Note: `unique` counts distinct sessions, so a session that lands, runs and
 * converts is counted once per stage — that is what makes the rates real
 * conversion rates rather than event ratios.
 */
export async function getFunnel(days: number = 14): Promise<DayFunnel[]> {
  const wanted = recentDays(Math.max(1, Math.min(days, RETENTION_DAYS)));
  const client = getRedis();

  if (!client) {
    return wanted.map((day) => {
      const entry = memory.get(day);
      const totals = emptyCounts();
      const unique = emptyCounts();
      if (entry) {
        for (const name of EVENT_NAMES) {
          totals[name] = entry.totals.get(name) || 0;
          unique[name] = entry.uniques.get(name)?.size || 0;
        }
      }
      return { day, totals, unique, rates: buildRates(unique) };
    });
  }

  try {
    const pipeline = client.pipeline();
    for (const day of wanted) {
      pipeline.hgetall(totalsKey(day));
      for (const name of EVENT_NAMES) pipeline.scard(uniqueKey(day, name));
    }
    const raw = (await pipeline.exec()) as unknown[];

    const perDay = 1 + EVENT_NAMES.length;
    return wanted.map((day, dayIndex) => {
      const base = dayIndex * perDay;
      const hash = (raw[base] as Record<string, string | number> | null) || {};
      const totals = emptyCounts();
      const unique = emptyCounts();

      for (const name of EVENT_NAMES) {
        totals[name] = Number(hash[name] ?? 0) || 0;
      }
      EVENT_NAMES.forEach((name, i) => {
        unique[name] = Number(raw[base + 1 + i] ?? 0) || 0;
      });

      return { day, totals, unique, rates: buildRates(unique) };
    });
  } catch (err) {
    console.error("[events] Failed to read funnel:", err);
    return [];
  }
}

/** Aggregate across the whole window — the headline numbers. */
export function summarizeFunnel(funnel: DayFunnel[]) {
  const totals = emptyCounts();
  const unique = emptyCounts();

  for (const day of funnel) {
    for (const name of EVENT_NAMES) {
      totals[name] += day.totals[name];
      // Sessions are per-day, so summing uniques across days is a close
      // approximation (a visitor returning on two days counts twice).
      unique[name] += day.unique[name];
    }
  }

  return { days: funnel.length, totals, unique, rates: buildRates(unique) };
}
