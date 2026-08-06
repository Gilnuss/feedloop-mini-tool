/**
 * Client-side funnel tracking — fire and forget.
 *
 * Rules this file obeys:
 *   - never throws (instrumentation must not break the UI)
 *   - never awaited by render or by the decode flow
 *   - stores nothing but an opaque per-tab session id
 */

"use client";

import type { EventName } from "./events";

const SESSION_KEY = "feedloop-decode-session";
const FIRED_PREFIX = "feedloop-decode-fired:";

/**
 * Per-tab anonymous id. sessionStorage (not localStorage) so it dies with the
 * tab — enough to stitch one visit's funnel together, not enough to follow
 * anyone across visits.
 */
function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private mode / storage disabled — skip tracking rather than fail.
    return null;
  }
}

function alreadyFired(event: EventName): boolean {
  try {
    return sessionStorage.getItem(FIRED_PREFIX + event) !== null;
  } catch {
    return false;
  }
}

function markFired(event: EventName): void {
  try {
    sessionStorage.setItem(FIRED_PREFIX + event, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Record a funnel event.
 *
 * @param once  Fire at most once per session. Use for `landed`, which would
 *              otherwise double-count under React StrictMode's dev remount.
 */
export function track(event: EventName, options: { once?: boolean } = {}): void {
  if (typeof window === "undefined") return;

  if (options.once) {
    if (alreadyFired(event)) return;
    markFired(event);
  }

  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    // keepalive so the request survives the tab closing or navigating away —
    // important for clicked_trial, which is followed by an outbound link.
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, sessionId }),
      keepalive: true,
    }).catch(() => {
      /* dropped event — acceptable, never surfaced */
    });
  } catch {
    /* ignore */
  }
}
