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
 * Methodology (matches how Amplitude/Mixpanel/GA4 compute funnels):
 *   - A funnel step satisfiable by several events is a set UNION of their
 *     session sets, never a sum — a session that fires two qualifying events
 *     is one session.
 *   - Every rate numerator is an INTERSECTION with its denominator set, so
 *     numerator ⊆ denominator holds by construction and no rate can exceed
 *     1.0. Sessions that convert without a recorded qualifying step are
 *     reported separately as orphans — a named data-quality signal instead of
 *     an impossible percentage.
 *   - Sessions are attributed to the UTC day they STARTED (entry-time
 *     attribution, the GA4 session rule): the client stamps the day into the
 *     session id and the server buckets every event of that session there,
 *     so a session straddling midnight cannot split across buckets.
 *
 * Storage: Upstash Redis, one totals hash + one session-id set per event per
 * UTC day. Falls back to in-memory for local dev — same pattern as
 * rateLimit.ts.
 *
 * Privacy: this module stores only an opaque random session id (localStorage,
 * 30-minute idle expiry, 24h max age — industry session semantics, see
 * track.ts) and an event name — no feedback text, no identity. Note that
 * /api/events separately passes the caller's IP to the Upstash rate limiter,
 * which keys on it, so an IP does transit the same Redis instance under the
 * `feedloop-events:*` prefix. It is never joined to a session id.
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
   * A previous run's result was restored from localStorage instead of a fresh
   * run. Together with reached_results this forms the "saw results" step — a
   * session that clicks the trial CTA after a cache-restore is a real
   * conversion, not a data error.
   */
  "viewed_cached_results",
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

/** Union groups — the multi-event funnel steps. */
const RAN_EVENTS: EventName[] = ["ran_sample", "ran_own_data", "ran_unknown_source"];
const FAILED_EVENTS: EventName[] = ["decode_failed", "decode_timeout", "rate_limited"];
const SAW_EVENTS: EventName[] = ["reached_results", "viewed_cached_results"];

/** Guard against arbitrary strings creating unbounded Redis keys. */
export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && EVENT_SET.has(value);
}

/**
 * Session ids are generated client-side; accept only our own shapes:
 * day-stamped `YYYYMMDD-<random>` (current) or bare random (legacy tabs that
 * were open across the deploy).
 */
export function isValidSessionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 64 &&
    /^(?:\d{8}-)?[A-Za-z0-9_-]{8,64}$/.test(value)
  );
}

// ── Keys ──

const PREFIX = "feedloop-decode:evt";
const RETENTION_DAYS = 90;
const TTL_SECONDS = RETENTION_DAYS * 24 * 60 * 60;
const SCRATCH_TTL_SECONDS = 120;

/**
 * How far back a session id's day-stamp is honored. Honest stamps are at most
 * ~2 days old (24h max session age), so 7 days is generous; anything outside
 * the window is clamped to today and counted, so mis-stamping is visible
 * rather than silently polluting reported history.
 */
const MAX_STAMP_AGE_DAYS = 7;

/** UTC day, e.g. "2026-08-08". */
export function dayKey(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

const totalsKey = (day: string) => `${PREFIX}:totals:${day}`;
const uniqueKey = (day: string, event: EventName) => `${PREFIX}:uniq:${day}:${event}`;
const scratchKey = (day: string, name: string) => `${PREFIX}:scratch:${day}:${name}`;

/** Server-side counter field in the totals hash — not a client-sendable event. */
const CLAMPED_FIELD = "bucket_clamped";

const SESSION_DAY_RE = /^(\d{4})(\d{2})(\d{2})-/;

/**
 * Entry-time attribution: derive the day-bucket from the session id's stamp.
 * Future or too-old stamps clamp to today (client-controlled input must not
 * write into already-reported history or into days that don't exist yet).
 */
export function bucketDayFor(
  sessionId: string,
  now: number = Date.now(),
): { day: string; clamped: boolean } {
  const m = SESSION_DAY_RE.exec(sessionId);
  if (!m) return { day: dayKey(now), clamped: false }; // legacy id — write-day attribution

  const stamped = `${m[1]}-${m[2]}-${m[3]}`;
  const t = Date.parse(`${stamped}T00:00:00Z`);
  if (Number.isNaN(t)) return { day: dayKey(now), clamped: true };

  const ageDays = Math.floor((now - t) / 86_400_000);
  if (ageDays < 0 || ageDays > MAX_STAMP_AGE_DAYS) {
    return { day: dayKey(now), clamped: true };
  }
  return { day: stamped, clamped: false };
}

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
  totals: Map<string, number>;
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
  const { day, clamped } = bucketDayFor(sessionId);
  const client = getRedis();

  if (!client) {
    const entry = memoryDay(day);
    entry.totals.set(event, (entry.totals.get(event) || 0) + 1);
    if (clamped) entry.totals.set(CLAMPED_FIELD, (entry.totals.get(CLAMPED_FIELD) || 0) + 1);
    const set = entry.uniques.get(event) || new Set<string>();
    set.add(sessionId);
    entry.uniques.set(event, set);
    return;
  }

  try {
    // One HTTP round trip. Totals count every fire; the set holds distinct
    // sessions — the unit all funnel math runs on.
    const pipeline = client.pipeline();
    pipeline.hincrby(totalsKey(day), event, 1);
    pipeline.sadd(uniqueKey(day, event), sessionId);
    if (clamped) pipeline.hincrby(totalsKey(day), CLAMPED_FIELD, 1);
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

/** The set cardinalities all rates are computed from — one per day. */
export interface DayCardinalities {
  /** |ran_sample ∪ ran_own_data ∪ ran_unknown_source| */
  ranAny: number;
  /** |decode_failed ∪ decode_timeout ∪ rate_limited| */
  failedAny: number;
  /** |reached_results ∪ viewed_cached_results| */
  sawResults: number;
  /** |landed ∩ ranAny| */
  landedAndRan: number;
  /** |ranAny ∩ sawResults| */
  ranAndSaw: number;
  /** |ranAny ∩ failedAny| */
  ranAndFailed: number;
  /** |sawResults ∩ clicked_trial| */
  sawAndTrial: number;
}

export interface DayFunnel {
  day: string;
  /** Every fire, including repeat runs in one session. */
  totals: Record<EventName, number>;
  /** Distinct sessions per raw event. */
  unique: Record<EventName, number>;
  /** Union/intersection cardinalities the rates are built from. */
  sets: DayCardinalities;
  /**
   * Sessions that hit a funnel stage without its qualifying step recorded —
   * the data-quality signal that used to surface as an impossible >100% rate.
   * Every known behavioral route is instrumented (fresh runs, cache restores,
   * and mid-page session rotation, which backfills its landed/saw state — see
   * track.ts), so the expected residual cause is event delivery loss:
   * track() is fire-and-forget, and a dropped qualifying event with a landed
   * conversion event leaves an orphan. Occasional ones are noise; a
   * persistent or growing count means an uninstrumented route.
   */
  orphans: {
    /** clicked_trial sessions that never saw results: |trial| − |saw ∩ trial| */
    trialClicks: number;
    /** runs with no landed: |ranAny| − |landed ∩ ranAny| */
    runsWithoutLanded: number;
  };
  /** Events whose day-stamp was rejected and clamped to the write day. */
  bucketClamped: number;
  /** Intersection ÷ denominator — structurally incapable of exceeding 1.0. */
  rates: {
    /** Of sessions that landed, how many ran anything at all. */
    landedToRun: number | null;
    /** Of sessions that ran anything, how many used their OWN feedback. */
    runToOwnData: number | null;
    /** Of sessions that ran anything, how many saw results. */
    runToResults: number | null;
    /** Of sessions that ran anything, how many hit a technical failure. */
    runToFailure: number | null;
    /** Of sessions that saw results (fresh run or cache-restore), how many
     *  clicked through to the trial. */
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

function buildRates(
  unique: Record<EventName, number>,
  sets: DayCardinalities,
): DayFunnel["rates"] {
  return {
    landedToRun: ratio(sets.landedAndRan, unique.landed),
    // ran_own_data is an input of the ranAny union, so own ⊆ ranAny holds by
    // construction and |ranAny ∩ own| = |own| — no intersection command needed.
    runToOwnData: ratio(unique.ran_own_data, sets.ranAny),
    runToResults: ratio(sets.ranAndSaw, sets.ranAny),
    runToFailure: ratio(sets.ranAndFailed, sets.ranAny),
    resultsToTrial: ratio(sets.sawAndTrial, sets.sawResults),
  };
}

function buildOrphans(
  unique: Record<EventName, number>,
  sets: DayCardinalities,
): DayFunnel["orphans"] {
  return {
    trialClicks: Math.max(0, unique.clicked_trial - sets.sawAndTrial),
    runsWithoutLanded: Math.max(0, sets.ranAny - sets.landedAndRan),
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

/** In-memory set algebra mirroring the Redis path, for dev. */
function memoryCardinalities(entry: MemoryDay | undefined): DayCardinalities {
  const get = (name: EventName) => entry?.uniques.get(name) ?? new Set<string>();
  const union = (names: EventName[]) => {
    const out = new Set<string>();
    for (const n of names) for (const id of get(n)) out.add(id);
    return out;
  };
  const interCard = (a: Set<string>, b: Set<string>) => {
    let count = 0;
    for (const id of a) if (b.has(id)) count++;
    return count;
  };

  const ran = union(RAN_EVENTS);
  const failed = union(FAILED_EVENTS);
  const saw = union(SAW_EVENTS);

  return {
    ranAny: ran.size,
    failedAny: failed.size,
    sawResults: saw.size,
    landedAndRan: interCard(get("landed"), ran),
    ranAndSaw: interCard(ran, saw),
    ranAndFailed: interCard(ran, failed),
    sawAndTrial: interCard(saw, get("clicked_trial")),
  };
}

/**
 * Per-day Redis command layout (kept in one place so the read pipeline and
 * its result-slicing cannot drift apart):
 *   1× HGETALL totals
 *   N× SCARD (one per event)
 *   3× (SUNIONSTORE + EXPIRE) for the ran/failed/saw union scratch keys
 *      — SUNIONSTORE returns the union's cardinality directly, unlike SUNION,
 *        which would ship every member over the REST transport just to count.
 *   4× SINTERCARD for the intersection numerators
 */
const CMDS_PER_DAY = 1 + EVENT_NAMES.length + 6 + 4;

/**
 * Read the funnel for the last `days` UTC days, oldest first.
 *
 * `unique` counts distinct sessions (localStorage id: spans tabs, 30-min idle
 * expiry, 24h cap — see track.ts), attributed to the day the session started.
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
      const sets = memoryCardinalities(entry);
      return {
        day,
        totals,
        unique,
        sets,
        orphans: buildOrphans(unique, sets),
        bucketClamped: entry?.totals.get(CLAMPED_FIELD) || 0,
        rates: buildRates(unique, sets),
      };
    });
  }

  try {
    const pipeline = client.pipeline();
    for (const day of wanted) {
      const ranScratch = scratchKey(day, "ran");
      const failedScratch = scratchKey(day, "failed");
      const sawScratch = scratchKey(day, "saw");

      pipeline.hgetall(totalsKey(day));
      for (const name of EVENT_NAMES) pipeline.scard(uniqueKey(day, name));

      const ranKeys = RAN_EVENTS.map((e) => uniqueKey(day, e));
      const failedKeys = FAILED_EVENTS.map((e) => uniqueKey(day, e));
      const sawKeys = SAW_EVENTS.map((e) => uniqueKey(day, e));

      pipeline.sunionstore(ranScratch, ranKeys[0], ...ranKeys.slice(1));
      pipeline.expire(ranScratch, SCRATCH_TTL_SECONDS);
      pipeline.sunionstore(failedScratch, failedKeys[0], ...failedKeys.slice(1));
      pipeline.expire(failedScratch, SCRATCH_TTL_SECONDS);
      pipeline.sunionstore(sawScratch, sawKeys[0], ...sawKeys.slice(1));
      pipeline.expire(sawScratch, SCRATCH_TTL_SECONDS);

      pipeline.sintercard([uniqueKey(day, "landed"), ranScratch]);
      pipeline.sintercard([ranScratch, sawScratch]);
      pipeline.sintercard([ranScratch, failedScratch]);
      pipeline.sintercard([sawScratch, uniqueKey(day, "clicked_trial")]);
    }
    const raw = (await pipeline.exec()) as unknown[];

    return wanted.map((day, dayIndex) => {
      const base = dayIndex * CMDS_PER_DAY;
      const hash = (raw[base] as Record<string, string | number> | null) || {};
      const totals = emptyCounts();
      const unique = emptyCounts();

      for (const name of EVENT_NAMES) {
        totals[name] = Number(hash[name] ?? 0) || 0;
      }
      EVENT_NAMES.forEach((name, i) => {
        unique[name] = Number(raw[base + 1 + i] ?? 0) || 0;
      });

      const afterScards = base + 1 + EVENT_NAMES.length;
      const num = (offset: number) => Number(raw[afterScards + offset] ?? 0) || 0;
      const sets: DayCardinalities = {
        ranAny: num(0), // SUNIONSTORE ran (offset 1 is its EXPIRE)
        failedAny: num(2),
        sawResults: num(4),
        landedAndRan: num(6),
        ranAndSaw: num(7),
        ranAndFailed: num(8),
        sawAndTrial: num(9),
      };

      return {
        day,
        totals,
        unique,
        sets,
        orphans: buildOrphans(unique, sets),
        bucketClamped: Number(hash[CLAMPED_FIELD] ?? 0) || 0,
        rates: buildRates(unique, sets),
      };
    });
  } catch (err) {
    console.error("[events] Failed to read funnel:", err);
    return [];
  }
}

/**
 * Aggregate across the whole window — the headline numbers.
 *
 * Pooled rates: sum the per-day intersection numerators and denominators, then
 * divide (Σ|A∩B| / Σ|B|). This keeps numerator ⊆ denominator across the
 * aggregation, and pooling avoids the Simpson's-paradox trap of averaging
 * daily rates. A visitor active on two days holds two session ids and counts
 * once per day — period uniques are NOT additive, so `unique` here is
 * session-days, not distinct visitors.
 */
export function summarizeFunnel(funnel: DayFunnel[]) {
  const totals = emptyCounts();
  const unique = emptyCounts();
  const sets: DayCardinalities = {
    ranAny: 0,
    failedAny: 0,
    sawResults: 0,
    landedAndRan: 0,
    ranAndSaw: 0,
    ranAndFailed: 0,
    sawAndTrial: 0,
  };
  let bucketClamped = 0;
  const orphans = { trialClicks: 0, runsWithoutLanded: 0 };

  for (const day of funnel) {
    for (const name of EVENT_NAMES) {
      totals[name] += day.totals[name];
      unique[name] += day.unique[name];
    }
    for (const key of Object.keys(sets) as (keyof DayCardinalities)[]) {
      sets[key] += day.sets[key];
    }
    orphans.trialClicks += day.orphans.trialClicks;
    orphans.runsWithoutLanded += day.orphans.runsWithoutLanded;
    bucketClamped += day.bucketClamped;
  }

  return {
    days: funnel.length,
    totals,
    unique,
    sets,
    orphans,
    bucketClamped,
    rates: buildRates(unique, sets),
  };
}
