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

          {/* Epics: clarifying questions to turn vague feedback into actionable items */}
          {cluster.kind === "epic" && cluster.followUpQuestions && cluster.followUpQuestions.length > 0 && (
            <div className="flex flex-col gap-2.5 bg-purple-500/5 border border-purple-500/10 rounded-lg p-4">
              <h5 className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                💡 Clarifying Questions
              </h5>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                This feedback is too vague for a ticket. Ask your users these questions to get actionable details:
              </p>
              <div className="flex flex-col gap-1.5">
                {cluster.followUpQuestions.map((q, i) => (
                  <p key={i} className="text-[13px] text-zinc-400 leading-relaxed">
                    &bull; &ldquo;{q}&rdquo;
                  </p>
                ))}
              </div>
              <p className="text-[11px] text-zinc-600 mt-1">
                With the full FeedLoop pipeline, clarifying questions are sent automatically through your feedback widget — closing the loop without manual follow-up.
              </p>
            </div>
          )}

          {/* Features: hint at full PRD capability */}
          {cluster.kind === "feature_ticket" && (
            <div className="flex items-start gap-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-4 py-3">
              <span className="text-yellow-400 text-xs mt-0.5 shrink-0">✦</span>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                <span className="text-yellow-400 font-medium">Want a complete PRD?</span>{" "}
                The full pipeline generates user stories, developer constraints, root cause analysis, and quality-scored tickets — ready for your CRM and coding agent.
              </p>
            </div>
          )}

          {/* Bugs: hint at root cause capability */}
          {cluster.kind === "bug_ticket" && (
            <div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/10 rounded-lg px-4 py-3">
              <span className="text-red-400 text-xs mt-0.5 shrink-0">✦</span>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                <span className="text-red-400 font-medium">Need root cause?</span>{" "}
                The full pipeline analyzes your codebase, identifies affected files, and produces developer-ready context with constraints — so your coding agent can start fixing immediately.
              </p>
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
