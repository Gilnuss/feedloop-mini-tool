"use client";

import { useEffect, useState } from "react";
import type { DecodeResult } from "@/lib/types";
import { ResultsDashboard } from "@/components/ResultsDashboard";

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
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[#1A1A1A]">
        <span className="text-lg font-semibold text-white">
          ⚡ FeedLoop Decode
        </span>
        <a
          href="/"
          className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
        >
          Try it yourself →
        </a>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-2xl animate-pulse">⏳</div>
            <p className="text-sm text-zinc-500">Loading results...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 max-w-md">
            <div className="text-4xl">😕</div>
            <h2 className="text-xl font-semibold text-white">
              Result not found
            </h2>
            <p className="text-sm text-zinc-400 text-center">{error}</p>
            <a
              href="/"
              className="px-6 py-2.5 bg-purple-600 rounded-lg text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
            >
              Decode your own feedback →
            </a>
          </div>
        )}

        {result && (
          <div className="flex flex-col items-center gap-8 w-full">
            {/* Banner */}
            <div className="w-full max-w-[700px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-[#27272A] rounded-xl py-4 px-6 text-center">
              <p className="text-base font-semibold text-white">
                {result.stats.inputCount} feedback items decoded into{" "}
                {result.stats.issueCount} real issues
              </p>
            </div>

            <ResultsDashboard result={result} readOnly />

            {/* CTA */}
            <a
              href="/"
              className="px-8 py-3.5 bg-purple-600 rounded-lg text-base font-semibold text-white hover:bg-purple-500 transition-colors"
            >
              Decode your own feedback — free, no signup →
            </a>
            <p className="text-xs text-zinc-600">
              Decoded by FeedLoop · decode.feedloop.dev
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
