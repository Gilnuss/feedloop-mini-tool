/**
 * POST /api/events — funnel event ingestion.
 *
 * Accepts: { event: EventName, sessionId: string }
 * Returns: 204 always (on success, and on anything a client cannot fix).
 *
 * Instrumentation is best-effort by design: a visitor must never see an error
 * because a counter failed. Invalid input is rejected with 400 so bugs surface
 * during development, but rate-limited and storage-failed writes are dropped
 * silently.
 */

import { NextRequest } from "next/server";
import { isOriginAllowed } from "@/lib/origins";
import { recordEvent, isEventName, isValidSessionId } from "@/lib/events";
import { checkEventRateLimit, getClientIP } from "@/lib/rateLimit";

// No `dynamic = "force-dynamic"` here: POST route handlers are never cached in
// Next 16, so it would be a no-op — and it is slated for removal once Cache
// Components is enabled.

const MAX_BODY_BYTES = 1024;

const noContent = () => new Response(null, { status: 204 });

export async function POST(req: NextRequest) {
  // Same allowlist as /api/decode — keeps other sites from writing our metrics.
  const origin = req.headers.get("origin");
  if (!isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const bodyText = await req.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return new Response(
      JSON.stringify({ error: "Body too large" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Reject unknown names so a malicious client cannot mint unbounded Redis keys.
  if (!isEventName(body.event) || !isValidSessionId(body.sessionId)) {
    return new Response(
      JSON.stringify({ error: "Invalid event or sessionId" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Its own budget — cannot consume the decode allowance.
  const allowed = await checkEventRateLimit(getClientIP(req.headers));
  if (!allowed) return noContent();

  await recordEvent(body.event, body.sessionId);

  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": origin! },
  });
}
