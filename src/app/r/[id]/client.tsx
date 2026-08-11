"use client";

import { useEffect, useState } from "react";
import type { DecodeResult } from "@/lib/types";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { DecodeTopbar } from "@/components/demo/DecodeTopbar";

export function SharedResultClient({ id }: { id: string }) {
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/results/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Result not found");
        }
        return res.json();
      })
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      <DecodeTopbar
        label="Shared result"
        right={
          <a
            href="/"
            className="px-3.5 py-1.5 bg-signal rounded-control text-[13px] font-semibold text-white shadow-card hover:bg-signal-hover transition-colors"
          >
            Decode your own feedback
          </a>
        }
      />

      <div className="flex-1 flex items-start justify-center px-4 sm:px-8 py-7 sm:py-8">
        {loading && (
          <div className="flex flex-col items-center gap-3 pt-16">
            <span className="w-5 h-5 rounded-full border-2 border-signal border-t-transparent animate-spin" />
            <p className="text-sm text-ink-dim">Loading results...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 max-w-md pt-16">
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-raised">
              <svg className="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-ink">Result not found</h2>
            <p className="text-sm text-ink-dim text-center">{error}</p>
            <a
              href="/"
              className="px-5 py-2.5 bg-signal rounded-control text-[13px] font-semibold text-white shadow-card hover:bg-signal-hover transition-colors"
            >
              Decode your own feedback →
            </a>
          </div>
        )}

        {result && (
          <div className="flex flex-col items-center gap-4 w-full max-w-[880px]">
            {/* Provenance banner — says what this page is before the numbers land */}
            <div className="flex flex-wrap items-center gap-2.5 w-full px-3.5 py-2.5 rounded-control bg-signal-bg border border-signal-border">
              <svg className="w-3.5 h-3.5 text-signal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-[13px] text-signal-text">
                Shared read-only result · {result.stats.inputCount} feedback items
                decoded into {result.stats.issueCount} real issues
              </span>
              <span className="ml-auto font-mono text-[11.5px] text-ink-dim">/r/{id}</span>
            </div>

            <ResultsDashboard result={result} readOnly />

            {/* Terminal CTA — the whole point of a shared link is the reader
                running their own batch, so this stays visually loud. */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-dashed border-line rounded-card bg-surface px-5 py-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-ink">
                  Run this on your own feedback
                </span>
                <span className="text-[12.5px] text-ink-dim">
                  Paste up to 100 items. No signup, results in seconds.
                </span>
              </div>
              <a
                href="/"
                className="sm:ml-auto px-4.5 py-2.5 bg-signal rounded-control text-[13px] font-semibold text-white shadow-card hover:bg-signal-hover transition-colors whitespace-nowrap"
              >
                Try Decode →
              </a>
            </div>

            <p className="text-xs text-ink-muted py-1">
              Decoded by FeedLoop · decode.feedloop.dev
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
