/**
 * Rate limiter + input security guards.
 * In-memory for dev. Vercel Edge middleware replaces this in prod.
 */

const MAX_RUNS_PER_HOUR = 5;
const BLOCK_AFTER_VIOLATIONS = 3;
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour
const MAX_ITEMS = 100;
const MIN_ITEMS = 10;
const MAX_ITEM_LENGTH = 2000;
const MAX_BODY_SIZE = 500 * 1024; // 500KB

interface RateLimitEntry {
  count: number;
  violations: number;
  resetAt: number;
  blockedUntil?: number;
}

const limits = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of limits) {
    if (now > entry.resetAt && !entry.blockedUntil) {
      limits.delete(ip);
    }
    if (entry.blockedUntil && now > entry.blockedUntil) {
      limits.delete(ip);
    }
  }
}, 10 * 60 * 1000);

/**
 * Check and consume a rate limit slot. Returns null if allowed, error message if blocked.
 */
export function checkRateLimit(ip: string): string | null {
  const now = Date.now();
  let entry = limits.get(ip);

  if (!entry) {
    entry = { count: 0, violations: 0, resetAt: now + 60 * 60 * 1000 };
    limits.set(ip, entry);
  }

  // Check if blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    const minutesLeft = Math.ceil((entry.blockedUntil - now) / 60000);
    return `Rate limit exceeded. Blocked for ${minutesLeft} more minutes.`;
  }

  // Reset if window expired
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.violations = 0;
    entry.resetAt = now + 60 * 60 * 1000;
    entry.blockedUntil = undefined;
  }

  // Check rate
  if (entry.count >= MAX_RUNS_PER_HOUR) {
    entry.violations++;
    if (entry.violations >= BLOCK_AFTER_VIOLATIONS) {
      entry.blockedUntil = now + BLOCK_DURATION_MS;
      return `Rate limit exceeded repeatedly. Blocked for 1 hour.`;
    }
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
 * Extract IP from request headers (Next.js).
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
