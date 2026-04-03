"use client";

import { useState } from "react";
import type { Cluster } from "@/lib/types";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-green-500",
};

const KIND_LABEL: Record<string, { text: string; color: string }> = {
  bug_ticket: { text: "BUG", color: "bg-red-500/15 text-red-400" },
  feature_ticket: { text: "FEATURE", color: "bg-yellow-500/15 text-yellow-400" },
  epic: { text: "EPIC", color: "bg-purple-500/15 text-purple-400" },
};

export function IssueCard({ cluster }: { cluster: Cluster }) {
  const [expanded, setExpanded] = useState(false);
  const kindInfo = KIND_LABEL[cluster.kind] || KIND_LABEL.epic;

  return (
    <div
      className={`w-full bg-[#141414] border border-[#27272A] border-l-[3px] ${SEVERITY_BORDER[cluster.severity] || "border-l-zinc-600"} rounded-xl overflow-hidden transition-colors hover:border-[#3F3F46]`}
    >
      {/* Header — clickable to expand */}
      <div
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${kindInfo.color}`}
          >
            {kindInfo.text}
          </span>
          <span
            className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold text-white ${SEVERITY_COLORS[cluster.severity] || "bg-zinc-600"}`}
          >
            {cluster.severity.toUpperCase()}
          </span>
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
        <div className="px-5 pb-5 flex flex-col gap-5 border-t border-[#27272A] pt-4">
          {/* Summary */}
          <p className="text-sm text-zinc-300 leading-relaxed">
            {cluster.summary}
          </p>

          {/* Acceptance criteria (bugs + features) */}
          {cluster.acceptanceCriteria.length > 0 && (
            <div className="flex flex-col gap-2.5 bg-[#0A0A0A] rounded-lg p-4">
              <h5 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Acceptance Criteria
              </h5>
              {cluster.acceptanceCriteria.map((ac, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="text-green-400 text-xs mt-0.5 shrink-0">☐</span>
                  <span className="text-[13px] text-zinc-400 leading-relaxed">{ac}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stories (epics) */}
          {cluster.stories.length > 0 && (
            <div className="flex flex-col gap-2.5 bg-[#0A0A0A] rounded-lg p-4">
              <h5 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Stories
              </h5>
              {cluster.stories.map((story, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="text-purple-400 text-xs mt-0.5 shrink-0">→</span>
                  <span className="text-[13px] text-zinc-400 leading-relaxed">{story}</span>
                </div>
              ))}
            </div>
          )}

          {/* PM Guidance — lead questions for actionable follow-up */}
          {cluster.kind === "epic" && (
            <div className="flex flex-col gap-2.5 bg-purple-500/5 border border-purple-500/10 rounded-lg p-4">
              <h5 className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                💡 Ask Your Users
              </h5>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                This feedback is strategic — not a specific bug or feature request. To turn it into actionable tickets, ask your users:
              </p>
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  &bull; &ldquo;What specific task were you trying to complete when this became a problem?&rdquo;
                </p>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  &bull; &ldquo;What workaround are you using today?&rdquo;
                </p>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  &bull; &ldquo;If we fixed this, what would you be able to do that you can&apos;t now?&rdquo;
                </p>
              </div>
            </div>
          )}

          {cluster.kind === "feature_ticket" && (
            <div className="flex flex-col gap-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-4">
              <h5 className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">
                💡 Validate This Request
              </h5>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Before building, confirm the need with your users:
              </p>
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  &bull; &ldquo;How often do you run into this? Daily, weekly, occasionally?&rdquo;
                </p>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  &bull; &ldquo;Would you switch to a competitor if they had this?&rdquo;
                </p>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  &bull; &ldquo;Show me how you&apos;d use this — walk me through the flow.&rdquo;
                </p>
              </div>
            </div>
          )}

          {cluster.kind === "bug_ticket" && (
            <div className="flex flex-col gap-2.5 bg-red-500/5 border border-red-500/10 rounded-lg p-4">
              <h5 className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                💡 Get Reproduction Details
              </h5>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                To fix this faster, gather from affected users:
              </p>
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  &bull; &ldquo;What device/browser were you using?&rdquo;
                </p>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  &bull; &ldquo;Can you show me the exact steps to reproduce it?&rdquo;
                </p>
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  &bull; &ldquo;Did this start recently, or has it always been like this?&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Original feedback items — stopPropagation to prevent card collapse */}
          <details
            className="group"
            onClick={(e) => e.stopPropagation()}
          >
            <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 select-none">
              ▸ Show original feedback ({cluster.items.length} items)
            </summary>
            <div className="mt-3 max-h-48 overflow-y-auto flex flex-col gap-2 pl-4 border-l-2 border-[#27272A]">
              {cluster.items.map((item, i) => (
                <p key={i} className="text-xs text-zinc-500 leading-relaxed">
                  &ldquo;{item.text.length > 200 ? item.text.slice(0, 200) + "..." : item.text}&rdquo;
                </p>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
