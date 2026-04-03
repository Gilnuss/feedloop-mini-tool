/**
 * POST /api/decode — Main pipeline endpoint with Server-Sent Events.
 *
 * Accepts: { items?: string[], rawText?: string }
 * Returns: SSE stream with progress events + final result
 *
 * SSE format:
 *   data: {"type":"progress","stage":"classifying","progress":15,"detail":"3/47"}
 *   data: {"type":"result","data":{...DecodeResult}}
 *   data: {"type":"error","message":"..."}
 */

import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { decodeFeedback } from "@/lib/pipeline";
import { checkRateLimit, validateInput, checkBodySize, getClientIP, sanitizeItem } from "@/lib/rateLimit";
import type { ProgressEvent } from "@/lib/types";

// Next.js edge runtime not needed — we want Node.js for longer execution
export const maxDuration = 60; // seconds (Vercel serverless)
export const dynamic = "force-dynamic";

// ── CORS allowed origins ──
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "https://feedloop-mini-tool.vercel.app",
  "https://decode.feedloop.dev",
]);

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

// ── Pipeline timeout (55s to stay under Vercel's 60s limit) ──
const PIPELINE_TIMEOUT_MS = 55_000;

export async function POST(req: NextRequest) {
  const requestId = randomUUID().slice(0, 8);

  try {
    // ── CORS origin check ──
    const origin = req.headers.get("origin");
    if (!isOriginAllowed(origin)) {
      return new Response(
        JSON.stringify({ error: "Origin not allowed", requestId }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Rate limit ──
    const ip = getClientIP(req.headers);
    const rateLimitError = await checkRateLimit(ip);
    if (rateLimitError) {
      return new Response(
        JSON.stringify({ error: rateLimitError, requestId }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Parse body ──
    const bodyText = await req.text();
    const bodySizeError = checkBodySize(bodyText.length);
    if (bodySizeError) {
      return new Response(
        JSON.stringify({ error: bodySizeError, requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Extract items ──
    let rawItems: string[];

    if (Array.isArray(body.items)) {
      rawItems = body.items.map((i: unknown) => String(i));
    } else if (typeof body.rawText === "string") {
      rawItems = body.rawText
        .split(/\n/)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
    } else {
      return new Response(
        JSON.stringify({ error: "Request must include 'items' (array) or 'rawText' (string)", requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── Sanitize + validate ──
    rawItems = rawItems.map(sanitizeItem).filter(item => item.length > 0);
    const validation = validateInput(rawItems);
    if ("error" in validation) {
      return new Response(
        JSON.stringify({ error: validation.error, requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ── SSE stream ──
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Timeout wrapper — abort if pipeline exceeds 55s (Vercel limit is 60s)
          const pipelinePromise = decodeFeedback(
            validation.items,
            (event: ProgressEvent) => {
              send({ type: "progress", ...event });
            },
          );
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Pipeline timeout")), PIPELINE_TIMEOUT_MS),
          );

          const result = await Promise.race([pipelinePromise, timeoutPromise]);

          // Strip embeddings + raw text from response (security + size)
          const cleanResult = {
            ...result,
            clusters: result.clusters.map(c => ({
              ...c,
              items: c.items.map(item => ({
                ...item,
                text: undefined,   // remove original unscrubbed text
                embedding: undefined,
              })),
            })),
          };

          send({ type: "result", data: cleanResult });
        } catch (err) {
          console.error(`[api/decode] Pipeline error (${requestId}):`, err);
          const message = err instanceof Error && err.message === "Pipeline timeout"
            ? "Analysis timed out. Try with fewer items."
            : "Analysis failed. Please try again.";
          send({ type: "error", message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Request-Id": requestId,
        "Access-Control-Allow-Origin": origin!,
      },
    });
  } catch (err) {
    console.error(`[api/decode] Unexpected error (${requestId}):`, err);
    return new Response(
      JSON.stringify({ error: "Internal error", requestId }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
