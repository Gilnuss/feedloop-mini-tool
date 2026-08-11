/**
 * POST /api/early-access — capture one early-access signup.
 *
 * Accepts: { email: string, feedbackSource: string }
 * Returns: 201 on a new signup, 200 on a repeat, 400/403/429 otherwise.
 *
 * Contract differs from /api/events on purpose. That route answers 204 to
 * almost everything because a lost counter is not the visitor's problem. This
 * one is the last step of the funnel: if the write fails the visitor must find
 * out, because nobody is coming back to re-enter an email they believe they
 * already gave.
 */

import { NextRequest } from "next/server";
import { isOriginAllowed } from "@/lib/origins";
import { readEarlyAccessSignup } from "@/lib/earlyAccess/earlyAccessSignupValidation";
import { saveEarlyAccessSignup } from "@/lib/earlyAccess/earlyAccessSignupStore";
import {
  isSignupAllowedForClient,
  describeSignupRateLimitRefusal,
} from "@/lib/earlyAccess/earlyAccessSignupRateLimit";

const MAX_BODY_BYTES = 1024;

/**
 * Local rather than imported from lib/rateLimit.ts: that copy exists to key the
 * decode limiter, and this route must keep working if its trust model changes.
 * x-vercel-forwarded-for first — the platform sets it and a client cannot forge it.
 */
function readClientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

function respondWithJson(payload: unknown, status: number, origin?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;

  return new Response(JSON.stringify(payload), { status, headers });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  // Same allowlist as /api/decode — keeps other sites from filling our list.
  if (!isOriginAllowed(origin)) {
    return respondWithJson({ error: "Origin not allowed" }, 403);
  }

  const bodyText = await req.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return respondWithJson({ error: "Body too large" }, 400, origin);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return respondWithJson({ error: "Invalid JSON body" }, 400, origin);
  }

  // JSON.parse accepts `null`, `42`, `[]` — none of which survive the property
  // reads in readEarlyAccessSignup.
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return respondWithJson({ error: "Body must be a JSON object" }, 400, origin);
  }

  const parsed = readEarlyAccessSignup(body as Record<string, unknown>);
  if ("problem" in parsed) {
    return respondWithJson({ error: parsed.problem }, 400, origin);
  }

  const isAllowed = await isSignupAllowedForClient(readClientIpFromHeaders(req.headers));
  if (!isAllowed) {
    return respondWithJson({ error: describeSignupRateLimitRefusal() }, 429, origin);
  }

  try {
    const { isFirstTimeSignup } = await saveEarlyAccessSignup(
      parsed.signup.emailAddress,
      parsed.signup.feedbackSourceId,
    );

    // 200 for a repeat so the client can stay quiet about it — telling someone
    // "you already signed up" reads as a rejection of a thing they did right.
    return respondWithJson({ ok: true }, isFirstTimeSignup ? 201 : 200, origin);
  } catch (err) {
    console.error("[api/early-access] Failed to save signup:", err);
    return respondWithJson(
      { error: "Could not save your details. Please try again." },
      500,
      origin,
    );
  }
}
