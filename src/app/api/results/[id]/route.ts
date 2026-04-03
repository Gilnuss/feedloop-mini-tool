/**
 * GET /api/results/:id — Fetch a stored decode result for shareable URLs.
 */

import { NextRequest } from "next/server";
import { getResult } from "@/lib/resultStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || id.length < 5 || id.length > 20) {
    return new Response(
      JSON.stringify({ error: "Invalid result ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const result = getResult(id);

  if (!result) {
    return new Response(
      JSON.stringify({ error: "Result not found or expired" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  // Strip embeddings + raw text from response (security + size)
  const clean = {
    ...result,
    clusters: result.clusters.map(c => ({
      ...c,
      items: c.items.map(item => ({
        ...item,
        text: undefined,
        embedding: undefined,
      })),
    })),
  };

  return new Response(JSON.stringify(clean), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
