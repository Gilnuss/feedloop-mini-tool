/**
 * GET /api/analytics — Internal analytics endpoint (protected).
 *
 * Returns all run analytics data. Protected by X-Analytics-Key header.
 * Query params: ?summary=true for summary stats only.
 */

import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { getAllRuns, getRunsSummary } from "@/lib/analytics";
import { getStoreSize } from "@/lib/resultStore";
import { getFunnel, summarizeFunnel } from "@/lib/events";

function isAuthorized(key: string | null, expected: string): boolean {
  if (!key) return false;
  try {
    const keyBuf = Buffer.from(key);
    const expectedBuf = Buffer.from(expected);
    if (keyBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(keyBuf, expectedBuf);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("X-Analytics-Key");
  const expectedKey = process.env.ANALYTICS_SECRET;

  if (!expectedKey || !isAuthorized(key, expectedKey)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const summaryOnly = req.nextUrl.searchParams.get("summary") === "true";

  // Funnel window, in days. This is the cohort dimension — compare a recent
  // week against an earlier one to see whether changes actually moved anything.
  const daysParam = Number(req.nextUrl.searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.floor(daysParam) : 14;

  const funnelByDay = await getFunnel(days);
  const funnel = summarizeFunnel(funnelByDay);

  if (summaryOnly) {
    const summary = getRunsSummary();
    return new Response(
      JSON.stringify({ summary, funnel, storedResults: getStoreSize() }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const runs = getAllRuns();
  const summary = getRunsSummary();

  // Strip originalText from item analytics (privacy)
  const sanitizedRuns = runs.map(run => ({
    ...run,
    items: run.items.map(item => ({
      ...item,
      originalText: undefined,
    })),
  }));

  return new Response(
    JSON.stringify({ summary, funnel, funnelByDay, storedResults: getStoreSize(), runs: sanitizedRuns }),
    { headers: { "Content-Type": "application/json" } },
  );
}
