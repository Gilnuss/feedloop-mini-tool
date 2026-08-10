/**
 * Rate limiter + input security guards.
 *
 * Uses Upstash Redis in production (distributed, survives serverless restarts).
 * Falls back to in-memory for local dev when UPSTASH env vars are not set.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const MAX_RUNS_PER_HOUR = 10;
/**
 * Funnel events are cheap and fire several times per visit, so they get their
 * own much larger budget. Kept separate from MAX_RUNS_PER_HOUR so that
 * instrumentation can never eat into a visitor's decode allowance.
 */
const MAX_EVENTS_PER_HOUR = 120;
const MAX_ITEMS = 100;
const MIN_ITEMS = 10;
const MAX_ITEM_LENGTH = 2000;
const MAX_BODY_SIZE = 500 * 1024; // 500KB

// ── Rate Limiter Setup ──

let ratelimit: Ratelimit | null = null;
let eventRatelimit: Ratelimit | null = null;

// In-memory fallback for dev
const inMemoryLimits = new Map<string, { count: number; resetAt: number }>();
const inMemoryEventLimits = new Map<string, { count: number; resetAt: number }>();

function getUpstashRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log("[rateLimit] No Upstash env vars — using in-memory fallback (dev only)");
    return null;
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_RUNS_PER_HOUR, "1 h"),
    analytics: true,
    prefix: "feedloop-decode",
  });

  return ratelimit;
}

function getUpstashEventRatelimit(): Ratelimit | null {
  if (eventRatelimit) return eventRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  eventRatelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_EVENTS_PER_HOUR, "1 h"),
    analytics: false,
    prefix: "feedloop-events",
  });

  return eventRatelimit;
}

/**
 * Separate, generous limit for funnel events. Returns true if allowed.
 * Deliberately silent — a dropped event is not worth an error response.
 */
export async function checkEventRateLimit(ip: string): Promise<boolean> {
  const rl = getUpstashEventRatelimit();

  if (rl) {
    try {
      const { success } = await rl.limit(ip);
      return success;
    } catch (err) {
      console.error("[rateLimit] Upstash unavailable for events:", err);
      return true; // fail open — never let instrumentation break a request
    }
  }

  const now = Date.now();
  let entry = inMemoryEventLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60 * 60 * 1000 };
    inMemoryEventLimits.set(ip, entry);
  }

  if (entry.count >= MAX_EVENTS_PER_HOUR) return false;

  entry.count++;
  return true;
}

/**
 * Check and consume a rate limit slot. Returns null if allowed, error message if blocked.
 */
export async function checkRateLimit(ip: string): Promise<string | null> {
  const rl = getUpstashRatelimit();

  if (rl) {
    // Production: Upstash distributed rate limiting.
    // Fail OPEN on Redis errors — if Upstash is down or over quota, an
    // unthrown error here would surface as a 500 from /api/decode and take
    // the whole product down to protect a rate limit.
    try {
      const { success, remaining, reset } = await rl.limit(ip);
      if (!success) {
        const minutesLeft = Math.max(1, Math.ceil((reset - Date.now()) / 60000));
        return `Rate limit: ${MAX_RUNS_PER_HOUR} runs per hour. Try again in ${minutesLeft} minutes. (${remaining} remaining)`;
      }
    } catch (err) {
      console.error("[rateLimit] Upstash unavailable, allowing request:", err);
    }
    return null;
  }

  // Dev fallback: in-memory
  const now = Date.now();
  let entry = inMemoryLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60 * 60 * 1000 };
    inMemoryLimits.set(ip, entry);
  }

  if (entry.count >= MAX_RUNS_PER_HOUR) {
    const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
    return `Rate limit: ${MAX_RUNS_PER_HOUR} runs per hour. Try again in ${minutesLeft} minutes.`;
  }

  entry.count++;
  return null;
}

// ── Input Validation ──

const HTML_TAG_RE = /<[^>]*>/g;
const SCRIPT_RE = /<script[\s\S]*?<\/script>/gi;

/**
 * Sanitize a single feedback item. Strips HTML, truncates.
 */
export function sanitizeItem(text: string): string {
  let clean = text;
  clean = clean.replace(SCRIPT_RE, "");
  clean = clean.replace(HTML_TAG_RE, "");
  clean = clean.slice(0, MAX_ITEM_LENGTH);
  return clean.trim();
}

/**
 * Validate and sanitize input items. Returns sanitized items or error message.
 */
export function validateInput(items: unknown): { items: string[] } | { error: string } {
  if (!Array.isArray(items)) {
    return { error: "items must be an array" };
  }

  if (items.length < MIN_ITEMS) {
    return { error: `Minimum ${MIN_ITEMS} items required, got ${items.length}` };
  }

  if (items.length > MAX_ITEMS) {
    return { error: `Maximum ${MAX_ITEMS} items allowed, got ${items.length}` };
  }

  const sanitized: string[] = [];
  for (const item of items) {
    if (typeof item !== "string") {
      return { error: "All items must be strings" };
    }
    const clean = sanitizeItem(item);
    if (clean.length > 0) {
      sanitized.push(clean);
    }
  }

  if (sanitized.length < MIN_ITEMS) {
    return { error: `After cleanup, only ${sanitized.length} valid items remain. Need at least ${MIN_ITEMS}.` };
  }

  return { items: sanitized };
}

/**
 * Check if request body size is within limits.
 */
export function checkBodySize(bodyLength: number): string | null {
  if (bodyLength > MAX_BODY_SIZE) {
    return `Request body too large: ${Math.round(bodyLength / 1024)}KB. Max: ${MAX_BODY_SIZE / 1024}KB.`;
  }
  return null;
}

/**
 * Extract IP from request headers.
 * On Vercel: uses x-vercel-forwarded-for (set by platform, not spoofable).
 * Fallback: x-forwarded-for, x-real-ip.
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
