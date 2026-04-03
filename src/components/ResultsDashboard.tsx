"use client";

import { useState } from "react";
import type { DecodeResult, Cluster } from "@/lib/types";
import { StatsBoxes } from "./StatsBoxes";
import { IssueCard } from "./IssueCard";
import { ShareButton } from "./ShareButton";

const SECTION_CONFIG = [
  { kind: "bug_ticket", label: "Bug Tickets", dot: "bg-red-500", countBg: "bg-red-500/15", countText: "text-red-400" },
  { kind: "feature_ticket", label: "Feature Requests", dot: "bg-yellow-500", countBg: "bg-yellow-500/15", countText: "text-yellow-400" },
  { kind: "epic", label: "Strategic Epics", dot: "bg-purple-500", countBg: "bg-purple-500/15", countText: "text-purple-400" },
] as const;

function TicketSection({
  config,
  clusters,
}: {
  config: (typeof SECTION_CONFIG)[number];
  clusters: Cluster[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);

  if (clusters.length === 0) return null;

  return (
    <div className="w-full bg-[#141414] border border-[#27272A] rounded-xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 bg-[#1A1A1A] hover:bg-[#1F1F1F] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className="text-[13px] font-semibold text-white">
            {config.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${config.countBg} ${config.countText}`}>
            {clusters.length}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {/* Ticket rows */}
      {expanded && (
        <div>
          {clusters.map((cluster) => {
            const isOpen = expandedTicket === cluster.id;

            return (
              <div key={cluster.id} className="border-t border-[#27272A]">
                {/* Row */}
                <button
                  onClick={() => setExpandedTicket(isOpen ? null : cluster.id)}
                  className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-[#1A1A1A]/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold text-white ${
                      cluster.severity === "critical" ? "bg-red-500" :
                      cluster.severity === "high" ? "bg-orange-500" :
                      cluster.severity === "medium" ? "bg-yellow-500" : "bg-green-500"
                    }`}>
                      {cluster.severity === "critical" ? "CRIT" : cluster.severity.toUpperCase()}
                    </span>
                    <span className="text-[13px] text-white truncate">
                      {cluster.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-[11px] font-mono text-zinc-600">
                      {cluster.reportCount} report{cluster.reportCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-zinc-600 text-xs">
                      {isOpen ? "▲" : "›"}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && <IssueCard cluster={cluster} inline />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface Props {
  result: DecodeResult;
  onReset?: () => void;
  onRunAgain?: () => void;
  readOnly?: boolean;
}

export function ResultsDashboard({ result, onReset, onRunAgain, readOnly }: Props) {
  const bugs = result.clusters.filter((c) => c.kind === "bug_ticket");
  const features = result.clusters.filter((c) => c.kind === "feature_ticket");
  const epics = result.clusters.filter((c) => c.kind === "epic");

  const sections = [
    { config: SECTION_CONFIG[0], clusters: bugs },
    { config: SECTION_CONFIG[1], clusters: features },
    { config: SECTION_CONFIG[2], clusters: epics },
  ];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[880px]">
      {/* Top bar */}
      {!readOnly && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <ShareButton resultId={result.id} />
            {onRunAgain && (
              <button
                onClick={onRunAgain}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#1A1A1A] border border-[#27272A] rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Run again
              </button>
            )}
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

      {/* CRM-style ticket sections */}
      {sections.map(({ config, clusters }) => (
        <TicketSection key={config.kind} config={config} clusters={clusters} />
      ))}

      {/* Upsell */}
      <div className="w-full border border-dashed border-[#27272A] rounded-xl p-6 flex flex-col items-center gap-5 bg-[#141414]">
        <p className="text-sm font-medium text-zinc-300">
          This was a one-time snapshot. With the full pipeline, this runs continuously:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-[13px] text-zinc-500">
          <div className="flex items-start gap-2.5">
            <span className="text-purple-400 mt-0.5">✦</span>
            <span><strong className="text-zinc-300">Feedback widget</strong> embedded on your site — captures user input 24/7</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-purple-400 mt-0.5">✦</span>
            <span><strong className="text-zinc-300">Smart dedup & grouping</strong> — duplicates merged, related items clustered automatically</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-purple-400 mt-0.5">✦</span>
            <span><strong className="text-zinc-300">Clarifying questions</strong> sent back to users through the widget — turns vague feedback into actionable details</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-purple-400 mt-0.5">✦</span>
            <span><strong className="text-zinc-300">Full PRDs & root cause</strong> — developer constraints, code analysis, quality-scored tickets</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-purple-400 mt-0.5">✦</span>
            <span><strong className="text-zinc-300">Synced to your CRM</strong> — tickets land in Jira, Linear, or GitHub Issues automatically</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-purple-400 mt-0.5">✦</span>
            <span><strong className="text-zinc-300">Coding agent ready</strong> — one click to launch an AI agent that opens a PR from the ticket</span>
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
        <a href="https://github.com/feedloop" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
          Self-host for free: github.com/feedloop
        </a>
      </div>
    </div>
  );
}
