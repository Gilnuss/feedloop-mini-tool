"use client";

import type { Cluster } from "@/lib/types";

/**
 * Tailwind cannot build class names at runtime, so every colour combination has
 * to exist as a literal string. These maps are that lookup — the values are all
 * tokens from globals.css, so a palette change still happens in one place.
 */
const KIND_BADGE: Record<string, { label: string; className: string }> = {
  bug_ticket: { label: "bug", className: "bg-kind-bug-bg text-kind-bug-fg" },
  feature_ticket: { label: "feature", className: "bg-kind-feature-bg text-kind-feature-fg" },
  epic: { label: "epic", className: "bg-kind-epic-bg text-kind-epic-fg" },
};

const SEVERITY_PILL: Record<string, { label: string; pill: string; dot: string }> = {
  critical: { label: "Critical", pill: "bg-sev-critical-bg text-sev-critical-fg", dot: "bg-sev-critical-dot" },
  high: { label: "High", pill: "bg-sev-high-bg text-sev-high-fg", dot: "bg-sev-high-dot" },
  medium: { label: "Medium", pill: "bg-sev-medium-bg text-sev-medium-fg", dot: "bg-sev-medium-dot" },
  low: { label: "Low", pill: "bg-sev-low-bg text-sev-low-fg", dot: "bg-sev-low-dot" },
};

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
      {children}
    </span>
  );
}

function ChecklistPanel({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-2 bg-surface border border-line rounded-control px-3.5 py-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2.5 items-start">
          <span className="w-3 h-3 mt-0.5 rounded-[3px] border-[1.5px] border-line shrink-0" />
          <span className="text-[13px] leading-relaxed text-ink-dim">{item}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * IssueCard — renders the expanded detail of a ticket.
 * When `inline` is true, renders without the outer card wrapper (used inside CRM table rows).
 */
export function IssueCard({ cluster, inline }: { cluster: Cluster; inline?: boolean }) {
  const kindBadge = KIND_BADGE[cluster.kind] || KIND_BADGE.epic;
  const severity = SEVERITY_PILL[cluster.severity] || SEVERITY_PILL.low;

  const content = (
    <div className="flex flex-col gap-4.5 px-4 sm:px-5 py-4.5">
      {/* Title header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded-pill text-xs font-semibold ${kindBadge.className}`}>
            {kindBadge.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-xs font-semibold ${severity.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${severity.dot}`} />
            {severity.label}
          </span>
          <span className="ml-auto font-mono text-[11.5px] text-ink-muted">
            {cluster.reportCount} report{cluster.reportCount !== 1 ? "s" : ""}
            {cluster.dedupCount > 0 && ` · ${cluster.dedupCount} merged`}
          </span>
        </div>
        <h3 className="text-[15px] font-semibold text-ink leading-snug">
          {cluster.title}
        </h3>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-2">
        <SectionEyebrow>Summary</SectionEyebrow>
        <p className="text-[13.5px] text-ink leading-relaxed max-w-[660px]">
          {cluster.summary}
        </p>
      </div>

      {/* Acceptance criteria (bugs + features) */}
      {cluster.acceptanceCriteria.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionEyebrow>
            {cluster.kind === "bug_ticket" ? "Definition of done" : "Acceptance criteria"}
          </SectionEyebrow>
          <ChecklistPanel items={cluster.acceptanceCriteria} />
        </div>
      )}

      {/* Stories (epics) */}
      {cluster.stories.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionEyebrow>Suggested work items</SectionEyebrow>
          <ChecklistPanel items={cluster.stories} />
        </div>
      )}

      {/* Epics: clarifying questions */}
      {cluster.kind === "epic" && cluster.followUpQuestions?.length > 0 && (
        <div className="flex flex-col gap-1.5 bg-signal-bg border border-signal-border rounded-control px-3.5 py-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-signal-text">
            Clarifying questions
          </span>
          <p className="text-[12.5px] text-ink-dim">
            Too vague for a ticket as written. Ask your users:
          </p>
          {cluster.followUpQuestions.map((q, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-ink">
              &ldquo;{q}&rdquo;
            </p>
          ))}
          <p className="text-[11.5px] text-ink-muted mt-0.5">
            With FeedLoop these are sent automatically through your feedback widget.
          </p>
        </div>
      )}

      {/* Features: hint */}
      {cluster.kind === "feature_ticket" && (
        <div className="flex items-start gap-2.5 bg-raised border border-line-subtle rounded-control px-3.5 py-3">
          <span className="text-signal text-xs mt-0.5 shrink-0">✦</span>
          <p className="text-[12.5px] text-ink-dim leading-relaxed">
            <span className="text-ink font-semibold">Need more detail from users?</span>{" "}
            FeedLoop sends targeted follow-up questions through your feedback widget — automatically gathering the context needed for a complete PRD, without manual outreach.
          </p>
        </div>
      )}

      {/* Bugs: hint */}
      {cluster.kind === "bug_ticket" && (
        <div className="flex items-start gap-2.5 bg-raised border border-line-subtle rounded-control px-3.5 py-3">
          <span className="text-signal text-xs mt-0.5 shrink-0">✦</span>
          <p className="text-[12.5px] text-ink-dim leading-relaxed">
            <span className="text-ink font-semibold">Have questions about this bug?</span>{" "}
            FeedLoop knows how to gather reproduction details from users — device info, steps, screenshots — sent automatically through your widget so you get actionable data without chasing anyone.
          </p>
        </div>
      )}

      {/* Original feedback */}
      <details onClick={(e) => e.stopPropagation()}>
        <summary className="text-[12.5px] text-ink-dim cursor-pointer hover:text-ink select-none">
          Show original feedback ({cluster.items.length} items)
        </summary>
        <div className="mt-3 max-h-48 overflow-y-auto flex flex-col gap-2 pl-3.5 border-l-2 border-line">
          {cluster.items.map((item, i) => (
            <p key={i} className="text-xs text-ink-dim leading-relaxed">
              &ldquo;{(item.cleaned || item.text || "").length > 200 ? (item.cleaned || item.text || "").slice(0, 200) + "..." : (item.cleaned || item.text || "")}&rdquo;
            </p>
          ))}
        </div>
      </details>
    </div>
  );

  if (inline) {
    return <div className="bg-canvas border-t border-line-subtle">{content}</div>;
  }

  return (
    <div className="w-full bg-surface border border-line rounded-card shadow-card overflow-hidden">
      {content}
    </div>
  );
}
