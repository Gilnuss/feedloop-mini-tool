"use client";

import type { DecodeResult } from "@/lib/types";
import { StatsBoxes } from "./StatsBoxes";
import { BreakdownCharts } from "./BreakdownCharts";
import { IssueCard } from "./IssueCard";
import { ShareButton } from "./ShareButton";

interface Props {
  result: DecodeResult;
  onReset?: () => void;
  readOnly?: boolean;
}

export function ResultsDashboard({ result, onReset, readOnly }: Props) {
  const bugs = result.clusters.filter((c) => c.kind === "bug_ticket");
  const features = result.clusters.filter((c) => c.kind === "feature_ticket");
  const epics = result.clusters.filter((c) => c.kind === "epic");

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-[880px]">
      {/* Nav row */}
      {!readOnly && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <ShareButton resultId={result.id} />
          </div>
          <button
            onClick={onReset}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← New analysis
          </button>
        </div>
      )}

      {/* Stats */}
      <StatsBoxes stats={result.stats} />

      {/* Breakdown */}
      <BreakdownCharts stats={result.stats} />

      {/* Bug tickets */}
      {bugs.length > 0 && (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Bug Tickets ({bugs.length})
            </h3>
          </div>
          {bugs.map((c) => (
            <IssueCard key={c.id} cluster={c} />
          ))}
        </div>
      )}

      {/* Feature tickets */}
      {features.length > 0 && (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Feature Tickets ({features.length})
            </h3>
          </div>
          {features.map((c) => (
            <IssueCard key={c.id} cluster={c} />
          ))}
        </div>
      )}

      {/* Epics */}
      {epics.length > 0 && (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Strategic Epics ({epics.length})
            </h3>
          </div>
          {epics.map((c) => (
            <IssueCard key={c.id} cluster={c} />
          ))}
        </div>
      )}

      {/* Locked upsell */}
      <div className="w-full border border-dashed border-[#27272A] rounded-xl p-6 flex flex-col items-center gap-4 bg-[#141414]">
        <p className="text-sm font-medium text-zinc-300">
          This was a one-time snapshot. With FeedLoop, this happens automatically:
        </p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-lg text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="text-purple-400">✦</span>
            Widget captures feedback 24/7
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">✦</span>
            Root cause & constraint analysis
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">✦</span>
            Auto-synced tickets in your CRM
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-400">✦</span>
            Coding agent ready with one click
          </div>
        </div>
        <a
          href="https://feedloop.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 px-7 py-3 bg-purple-600 rounded-lg text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
        >
          Try the full pipeline — 14 days free →
        </a>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-zinc-600">
        <span>Decoded by FeedLoop</span>
        <span>·</span>
        <a
          href="https://github.com/feedloop"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300"
        >
          Self-host for free: github.com/feedloop
        </a>
      </div>
    </div>
  );
}
