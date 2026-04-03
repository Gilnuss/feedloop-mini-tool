"use client";

import { useState } from "react";
import type { Cluster } from "@/lib/types";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const KIND_EMOJI: Record<string, string> = {
  bug_ticket: "🔴",
  feature_ticket: "🟡",
  epic: "📋",
};

export function IssueCard({ cluster }: { cluster: Cluster }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="w-full bg-[#141414] border border-[#27272A] rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-[#3F3F46]"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header — always visible */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-white ${SEVERITY_COLORS[cluster.severity] || "bg-zinc-600"}`}
          >
            {cluster.severity.toUpperCase()}
          </span>
          <span className="text-sm">{KIND_EMOJI[cluster.kind] || "📋"}</span>
          <span className="text-sm font-medium text-white truncate">
            {cluster.title}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-xs font-mono text-zinc-500">
            {cluster.reportCount} report{cluster.reportCount !== 1 ? "s" : ""}
            {cluster.dedupCount > 0 && ` · ${cluster.dedupCount} dupes`}
          </span>
          <span className="text-zinc-500 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[#27272A] pt-4">
          {/* Summary */}
          <p className="text-sm text-zinc-400 leading-relaxed">
            {cluster.summary}
          </p>

          {/* Acceptance criteria (bugs + features) */}
          {cluster.acceptanceCriteria.length > 0 && (
            <div className="flex flex-col gap-2">
              <h5 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Acceptance Criteria
              </h5>
              {cluster.acceptanceCriteria.map((ac, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-green-400 text-sm shrink-0">✓</span>
                  <span className="text-sm text-zinc-400">{ac}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stories (epics) */}
          {cluster.stories.length > 0 && (
            <div className="flex flex-col gap-2">
              <h5 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Stories
              </h5>
              {cluster.stories.map((story, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-purple-400 text-sm shrink-0">→</span>
                  <span className="text-sm text-zinc-400">{story}</span>
                </div>
              ))}
            </div>
          )}

          {/* Original feedback items */}
          <details className="group">
            <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
              Show original feedback ({cluster.items.length} items)
            </summary>
            <div className="mt-2 max-h-40 overflow-y-auto flex flex-col gap-1.5 pl-4 border-l border-[#27272A]">
              {cluster.items.map((item, i) => (
                <p key={i} className="text-xs text-zinc-500 leading-relaxed">
                  &ldquo;{item.text.length > 150 ? item.text.slice(0, 150) + "..." : item.text}&rdquo;
                </p>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
