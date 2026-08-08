/**
 * Client-side funnel tracking — fire and forget.
 *
 * Session model (matches PostHog/GA4 semantics, minus the cookie):
 *   - one session spans tabs and windows (localStorage, not sessionStorage —
 *     a user comparing two runs in two tabs is one visitor, not two)
 *   - 30 minutes of inactivity ends the session; next event starts a new one
 *   - 24h hard cap, so an ancient tab cannot keep writing into a day-bucket
 *     that has already been read and reported
 *   - the session id embeds the UTC day it was created (`YYYYMMDD-<random>`);
 *     the server buckets every event of the session to that day, so a session
 *     straddling midnight lands in exactly one bucket (entry-time attribution)
 *
 * Rules this file obeys:
 *   - never throws (instrumentation must not break the UI)
 *   - never awaited by render or by the decode flow
 *   - stores nothing but the opaque session record below
 */

"use client";

import type { EventName } from "./events";

const SESSION_KEY = "feedloop-decode-session";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

interface StoredSession {
  id: string;
  createdAt: number;
  lastActive: number;
  /** Once-per-session events already sent — lives inside the session record
   *  so it rotates atomically with the id. */
  fired: Partial<Record<EventName, true>>;
}

/** UTC day stamp — getUTC* semantics via toISOString, never local time
 *  (a local-time stamp from UTC+13 would date the session tomorrow). */
function utcDayStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function newSession(): StoredSession {
  const now = Date.now();
  return {
    id: `${utcDayStamp()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    createdAt: now,
    lastActive: now,
    fired: {},
  };
}

function persist(session: StoredSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

/**
 * Load-or-rotate. Returns null only when storage is unavailable (private
 * mode) — in which case tracking is skipped entirely rather than failing.
 */
function getSession(): { session: StoredSession; isNew: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const now = Date.now();
    let session: StoredSession | null = null;

    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession;
      if (
        parsed &&
        typeof parsed.id === "string" &&
        typeof parsed.createdAt === "number" &&
        typeof parsed.lastActive === "number" &&
        now - parsed.lastActive <= IDLE_TIMEOUT_MS &&
        now - parsed.createdAt <= MAX_SESSION_AGE_MS
      ) {
        session = { ...parsed, fired: parsed.fired || {} };
      }
    }

    const isNew = session === null;
    if (!session) session = newSession();
    session.lastActive = now;
    persist(session);
    return { session, isNew };
  } catch {
    return null;
  }
}

function post(event: EventName, sessionId: string): void {
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

/**
 * Record a funnel event.
 *
 * @param once  Fire at most once per session (e.g. `landed`, which would
 *              otherwise repeat on every reload and under StrictMode's dev
 *              remount).
 */
export function track(event: EventName, options: { once?: boolean } = {}): void {
  if (typeof window === "undefined") return;

  const loaded = getSession();
  if (!loaded) return;
  const { session, isNew } = loaded;

  // A session that rotates mid-page (30-min idle on the results screen, then
  // a click) still "entered" the site — backfill its landed so the new
  // bucket's denominator exists and the click doesn't become an orphan.
  if (isNew && event !== "landed" && !session.fired.landed) {
    session.fired.landed = true;
    persist(session);
    post("landed", session.id);
  }

  if (options.once) {
    if (session.fired[event]) return;
    session.fired[event] = true;
    persist(session);
  }

  post(event, session.id);
}
