/**
 * GET /api/analytics — Internal analytics endpoint (protected).
 *
 * Returns all run analytics data. Protected by X-Analytics-Key header.
 * Query params: ?summary=true for summary stats only.
 */

import { NextRequest } from "next/server";
import { getAllRuns, getRunsSummary } from "@/lib/analytics";
import { getStoreSize } from "@/lib/resultStore";

export async function GET(req: NextRequest) {
  const key = req.headers.get("X-Analytics-Key");
  const expectedKey = process.env.ANALYTICS_SECRET;

  if (!expectedKey || key !== expectedKey) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const summaryOnly = req.nextUrl.searchParams.get("summary") === "true";

  if (summaryOnly) {
    const summary = getRunsSummary();
    return new Response(
      JSON.stringify({ summary, storedResults: getStoreSize() }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const runs = getAllRuns();
  const summary = getRunsSummary();

  return new Response(
    JSON.stringify({ summary, storedResults: getStoreSize(), runs }),
    { headers: { "Content-Type": "application/json" } },
  );
}
