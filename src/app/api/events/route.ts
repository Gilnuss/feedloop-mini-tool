/**
 * POST /api/events — funnel event ingestion.
 *
 * Accepts: { event: EventName, sessionId: string }
 * Returns: 204 always (on success, and on anything a client cannot fix).
 *
 * Instrumentation is best-effort by design: a visitor must never see an error
 * because a counter failed. Invalid input is rejected with 400 so bugs surface
 * during development, but rate-limited and storage-failed writes are dropped
 * silently. Nothing here may escape as a 500 — the contract is 403/400/204.
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

const badRequest = (error: string) =>
  new Response(JSON.stringify({ error }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(req: NextRequest) {
  try {
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
      return badRequest("Body too large");
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return badRequest("Invalid JSON body");
    }

    // JSON.parse accepts any JSON value — `null`, `42`, `"x"`, `[]` — not just
    // objects. A literal `null` body would crash the property access below
    // (TypeError → 500), breaking this route's 400/204 contract.
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return badRequest("Body must be a JSON object");
    }

    // Reject unknown names so a malicious client cannot mint unbounded Redis keys.
    if (!isEventName(body.event) || !isValidSessionId(body.sessionId)) {
      return badRequest("Invalid event or sessionId");
    }

    // Its own budget — cannot consume the decode allowance.
    const allowed = await checkEventRateLimit(getClientIP(req.headers));
    if (!allowed) return noContent();

    await recordEvent(body.event, body.sessionId);

    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": origin! },
    });
  } catch (err) {
    // Unexpected failure recording a metric is not the visitor's problem —
    // log it, drop the event, respond as if nothing happened.
    console.error("[api/events] Unexpected error:", err);
    return noContent();
  }
}
