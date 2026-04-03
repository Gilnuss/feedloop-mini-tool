"use client";

import type { Cluster } from "@/lib/types";

const KIND_LABEL: Record<string, { text: string; color: string }> = {
  bug_ticket: { text: "BUG", color: "text-red-400" },
  feature_ticket: { text: "FEATURE", color: "text-yellow-400" },
  epic: { text: "EPIC", color: "text-purple-400" },
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

/**
 * IssueCard — renders the expanded detail of a ticket.
 * When `inline` is true, renders without the outer card wrapper (used inside CRM table rows).
 */
export function IssueCard({ cluster, inline }: { cluster: Cluster; inline?: boolean }) {
  const kindInfo = KIND_LABEL[cluster.kind] || KIND_LABEL.epic;

  const content = (
    <div className="flex flex-col gap-5 px-3 sm:px-5 py-5">
      {/* Title header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${kindInfo.color}`}>
            {kindInfo.text}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[cluster.severity]}`} />
          <span className="text-[10px] font-mono text-zinc-600 uppercase">
            {cluster.severity}
          </span>
          <span className="text-[10px] text-zinc-700 ml-auto">
            {cluster.reportCount} report{cluster.reportCount !== 1 ? "s" : ""}
            {cluster.dedupCount > 0 && ` · ${cluster.dedupCount} merged`}
          </span>
        </div>
        <h3 className="text-base font-semibold text-white leading-snug">
          {cluster.title}
        </h3>
      </div>

      {/* Summary */}
      <div>
        <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Summary
        </h4>
        <p className="text-[13px] text-zinc-300 leading-relaxed">
          {cluster.summary}
        </p>
      </div>

      {/* Acceptance criteria (bugs + features) */}
      {cluster.acceptanceCriteria.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            {cluster.kind === "bug_ticket" ? "Definition of Done" : "Acceptance Criteria"}
          </h4>
          <div className="flex flex-col gap-2 bg-[#0A0A0A] rounded-lg p-4">
            {cluster.acceptanceCriteria.map((ac, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-green-400 text-xs mt-0.5 shrink-0">☐</span>
                <span className="text-[13px] text-zinc-400 leading-relaxed">{ac}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stories (epics) */}
      {cluster.stories.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Suggested Work Items
          </h4>
          <div className="flex flex-col gap-2 bg-[#0A0A0A] rounded-lg p-4">
            {cluster.stories.map((story, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-purple-400 text-[13px] mt-0.5 shrink-0 font-mono">{i + 1}.</span>
                <span className="text-[13px] text-zinc-400 leading-relaxed">{story}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Epics: clarifying questions */}
      {cluster.kind === "epic" && cluster.followUpQuestions && cluster.followUpQuestions.length > 0 && (
        <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-4">
          <h4 className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-2">
            💡 Clarifying Questions
          </h4>
          <p className="text-[12px] text-zinc-500 leading-relaxed mb-2">
            This feedback is too vague for a ticket. Ask your users:
          </p>
          <div className="flex flex-col gap-1.5">
            {cluster.followUpQuestions.map((q, i) => (
              <p key={i} className="text-[13px] text-zinc-400 leading-relaxed">
                &bull; &ldquo;{q}&rdquo;
              </p>
            ))}
          </div>
          <p className="text-[11px] text-zinc-600 mt-2">
            With FeedLoop, clarifying questions are sent automatically through your feedback widget.
          </p>
        </div>
      )}

      {/* Features: hint */}
      {cluster.kind === "feature_ticket" && (
        <div className="flex items-start gap-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-4 py-3">
          <span className="text-yellow-400 text-xs mt-0.5 shrink-0">✦</span>
          <p className="text-[12px] text-zinc-500 leading-relaxed">
            <span className="text-yellow-400 font-medium">Need more detail from users?</span>{" "}
            FeedLoop sends targeted follow-up questions through your feedback widget — automatically gathering the context needed for a complete PRD, without manual outreach.
          </p>
        </div>
      )}

      {/* Bugs: hint */}
      {cluster.kind === "bug_ticket" && (
        <div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/10 rounded-lg px-4 py-3">
          <span className="text-red-400 text-xs mt-0.5 shrink-0">✦</span>
          <p className="text-[12px] text-zinc-500 leading-relaxed">
            <span className="text-red-400 font-medium">Have questions about this bug?</span>{" "}
            FeedLoop knows how to gather reproduction details from users — device info, steps, screenshots — sent automatically through your widget so you get actionable data without chasing anyone.
          </p>
        </div>
      )}

      {/* Original feedback */}
      <details onClick={(e) => e.stopPropagation()}>
        <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 select-none">
          ▸ Show original feedback ({cluster.items.length} items)
        </summary>
        <div className="mt-3 max-h-48 overflow-y-auto flex flex-col gap-2 pl-4 border-l-2 border-[#27272A]">
          {cluster.items.map((item, i) => (
            <p key={i} className="text-xs text-zinc-500 leading-relaxed">
              &ldquo;{(item.cleaned || item.text || "").length > 200 ? (item.cleaned || item.text || "").slice(0, 200) + "..." : (item.cleaned || item.text || "")}&rdquo;
            </p>
          ))}
        </div>
      </details>
    </div>
  );

  if (inline) {
    return <div className="bg-[#111111] border-t border-[#27272A]">{content}</div>;
  }

  return (
    <div className="w-full bg-[#141414] border border-[#27272A] rounded-xl overflow-hidden">
      {content}
    </div>
  );
}
