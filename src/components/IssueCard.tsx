"use client";

import type { Cluster } from "@/lib/types";

/**
 * IssueCard — renders the expanded detail of a ticket.
 * When `inline` is true, renders without the outer card wrapper (used inside CRM table rows).
 */
export function IssueCard({ cluster, inline }: { cluster: Cluster; inline?: boolean }) {
  const content = (
    <div className="flex flex-col gap-4 px-5 py-4">
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

      {/* Epics: clarifying questions */}
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
            With the full FeedLoop pipeline, clarifying questions are sent automatically through your feedback widget.
          </p>
        </div>
      )}

      {/* Features: hint at gathering more detail */}
      {cluster.kind === "feature_ticket" && (
        <div className="flex items-start gap-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-4 py-3">
          <span className="text-yellow-400 text-xs mt-0.5 shrink-0">✦</span>
          <p className="text-[12px] text-zinc-500 leading-relaxed">
            <span className="text-yellow-400 font-medium">Need more detail from users?</span>{" "}
            FeedLoop sends targeted follow-up questions through your feedback widget — automatically gathering the context needed for a complete PRD, without manual outreach.
          </p>
        </div>
      )}

      {/* Bugs: hint at gathering reproduction data */}
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
              &ldquo;{item.text.length > 200 ? item.text.slice(0, 200) + "..." : item.text}&rdquo;
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
