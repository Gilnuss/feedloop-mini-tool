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
import { isOriginAllowed } from "@/lib/origins";
import type { ProgressEvent } from "@/lib/types";

// Next.js edge runtime not needed — we want Node.js for longer execution
export const maxDuration = 60; // seconds (Vercel serverless)
export const dynamic = "force-dynamic";

// CORS allowlist lives in @/lib/origins so /api/decode and /api/events stay in sync.

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
        // The client can vanish at any moment — reload, back button, closed tab,
        // dev hot-reload. Once that happens the controller is closed and every
        // further enqueue throws ERR_INVALID_STATE, which used to cascade: the
        // catch below would try to send an error (throw), then finally would
        // close an already-closed controller (throw again).
        let closed = false;

        const send = (data: Record<string, unknown>) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {
            closed = true; // client went away mid-write
          }
        };

        // Stop doing paid work when nobody will see the answer: the pipeline
        // aborts on EITHER a client disconnect or the 55s timeout (Vercel's
        // limit is 60s). AbortSignal.any fires when the first of them does,
        // so a timed-out run no longer keeps making LLM/embedding calls in
        // the background — and timeouts skew to the biggest, most expensive
        // inputs.
        const timeoutSignal = AbortSignal.timeout(PIPELINE_TIMEOUT_MS);
        const pipelineSignal = AbortSignal.any([req.signal, timeoutSignal]);
        const onClientGone = () => {
          closed = true;
        };
        req.signal.addEventListener("abort", onClientGone);

        try {
          const pipelinePromise = decodeFeedback(
            validation.items,
            (event: ProgressEvent) => {
              send({ type: "progress", ...event });
            },
            pipelineSignal,
          );
          // If the timeout wins the race below, the pipeline promise settles
          // later (rejecting at its next stage boundary) — swallow that late
          // rejection so it cannot surface as an unhandled rejection.
          pipelinePromise.catch(() => {});

          // The race is still needed for promptness: the pipeline only checks
          // its signal at stage boundaries, which can be many seconds apart.
          const timeoutPromise = new Promise<never>((_, reject) =>
            timeoutSignal.addEventListener(
              "abort",
              () => reject(new Error("Pipeline timeout")),
              { once: true },
            ),
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
          const isTimeout = err instanceof Error && err.message === "Pipeline timeout";
          const clientGone = closed || req.signal.aborted;

          if (clientGone) {
            // Not a failure worth alerting on — nobody is listening.
            console.log(`[api/decode] Client disconnected (${requestId}), pipeline aborted`);
          } else {
            console.error(`[api/decode] Pipeline error (${requestId}):`, err);
            // `reason` lets the client tell a timeout from a real failure, so
            // the funnel can separate the two instead of lumping both into
            // "user gave up".
            send({
              type: "error",
              reason: isTimeout ? "timeout" : "pipeline",
              message: isTimeout
                ? "Analysis timed out. Try with fewer items."
                : "Analysis failed. Please try again.",
            });
          }
        } finally {
          req.signal.removeEventListener("abort", onClientGone);
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              /* already closed by the runtime */
            }
          }
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
