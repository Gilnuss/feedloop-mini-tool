/**
 * Shared CORS origin allowlist.
 *
 * Extracted so /api/decode and /api/events cannot drift apart — a new
 * deployment domain must only be added in one place.
 */

export const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "https://feedloop-mini-tool.vercel.app",
  "https://decode.feedloop.dev",
]);

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}
