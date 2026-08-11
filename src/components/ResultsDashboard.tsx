"use client";

import { useState } from "react";
import type { DecodeResult, Cluster } from "@/lib/types";
import { StatsBoxes } from "./StatsBoxes";
import { IssueCard } from "./IssueCard";
import { ShareButton } from "./ShareButton";
import { track } from "@/lib/track";

/**
 * Section config. Dot and count-pill colours are tokens from globals.css, spelled
 * out as literal class strings because Tailwind cannot compose them at runtime.
 */
const SECTION_CONFIG = [
  { kind: "bug_ticket", label: "Bug Tickets", dot: "bg-kind-bug-dot", pill: "bg-kind-bug-bg text-kind-bug-fg" },
  { kind: "feature_ticket", label: "Feature Requests", dot: "bg-kind-feature-dot", pill: "bg-kind-feature-bg text-kind-feature-fg" },
  { kind: "epic", label: "Strategic Epics", dot: "bg-kind-epic-dot", pill: "bg-kind-epic-bg text-kind-epic-fg" },
] as const;

const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;
const SEVERITY_PILL: Record<string, { label: string; pill: string; dot: string }> = {
  critical: { label: "Critical", pill: "bg-sev-critical-bg text-sev-critical-fg", dot: "bg-sev-critical-dot" },
  high: { label: "High", pill: "bg-sev-high-bg text-sev-high-fg", dot: "bg-sev-high-dot" },
  medium: { label: "Medium", pill: "bg-sev-medium-bg text-sev-medium-fg", dot: "bg-sev-medium-dot" },
  low: { label: "Low", pill: "bg-sev-low-bg text-sev-low-fg", dot: "bg-sev-low-dot" },
};

const UPSELL_BULLETS: [string, string][] = [
  ["Feedback widget", "embedded on your site — captures user input around the clock"],
  ["Smart dedup & grouping", "duplicates merged, related items clustered automatically"],
  ["Clarifying questions", "sent back to users through the widget, turning vague feedback into detail"],
  ["Full PRDs & root cause", "developer constraints, code analysis, quality-scored tickets"],
  ["Synced to your CRM", "tickets land in Jira, Linear or GitHub Issues automatically"],
  ["Coding agent ready", "one click to launch an agent that opens a PR from the ticket"],
];

function TicketRow({ cluster, isOpen, onToggle }: { cluster: Cluster; isOpen: boolean; onToggle: () => void }) {
  const severity = SEVERITY_PILL[cluster.severity] || SEVERITY_PILL.low;

  return (
    <div className="border-t border-line-subtle">
      <button
        onClick={onToggle}
        className={`flex items-start sm:items-center justify-between w-full gap-3 px-4 sm:px-5 py-2.5 text-left transition-colors ${
          isOpen ? "bg-raised" : "bg-surface hover:bg-raised"
        }`}
      >
        <span className="text-[13.5px] font-medium text-ink line-clamp-2 sm:truncate min-w-0">
          {cluster.title}
        </span>

        <span className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          <span className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-xs font-semibold ${severity.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${severity.dot}`} />
            {severity.label}
          </span>
          <span className="font-mono text-[11.5px] text-ink-muted whitespace-nowrap">
            {cluster.reportCount} report{cluster.reportCount !== 1 ? "s" : ""}
            {cluster.dedupCount > 0 && ` · ${cluster.dedupCount} dupes`}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isOpen && <IssueCard cluster={cluster} inline />}
    </div>
  );
}

function TicketSection({ config, clusters }: { config: (typeof SECTION_CONFIG)[number]; clusters: Cluster[] }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);

  if (clusters.length === 0) return null;

  const bySeverity: Record<string, Cluster[]> = {};
  for (const c of clusters) {
    if (!bySeverity[c.severity]) bySeverity[c.severity] = [];
    bySeverity[c.severity].push(c);
  }

  const severityLevels = SEVERITY_ORDER.filter((s) => bySeverity[s]?.length);
  const showSeverityHeaders = severityLevels.length > 1;

  return (
    <div className="w-full bg-surface border border-line rounded-card shadow-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 w-full px-4 sm:px-5 py-2.5 bg-raised hover:bg-line-subtle transition-colors"
      >
        <span className={`w-[7px] h-[7px] rounded-full ${config.dot}`} />
        <span className="text-[13.5px] font-semibold text-ink">{config.label}</span>
        <span className={`px-2 py-0.5 rounded-full font-mono text-[11.5px] font-semibold ${config.pill}`}>
          {clusters.length}
        </span>
        <svg
          className={`ml-auto w-3.5 h-3.5 text-ink-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div>
          {severityLevels.map((severity) => (
            <div key={severity}>
              {showSeverityHeaders && (
                <div className="flex items-center gap-2 px-4 sm:px-5 py-1.5 border-t border-line-subtle bg-canvas">
                  <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_PILL[severity].dot}`} />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    {SEVERITY_PILL[severity].label} ({bySeverity[severity].length})
                  </span>
                </div>
              )}
              {bySeverity[severity].map((cluster) => (
                <TicketRow
                  key={cluster.id}
                  cluster={cluster}
                  isOpen={expandedTicket === cluster.id}
                  onToggle={() => setExpandedTicket(expandedTicket === cluster.id ? null : cluster.id)}
                />
              ))}
            </div>
          ))}
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
    <div className="flex flex-col items-center gap-4 w-full max-w-[880px]">
      {/* Top bar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2.5 w-full">
          <ShareButton resultId={result.id} />
          {onRunAgain && (
            <button
              onClick={onRunAgain}
              className="flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-control text-[13px] font-semibold text-ink-dim hover:text-ink hover:bg-raised transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run again
            </button>
          )}
          <button
            onClick={onReset}
            className="ml-auto px-1 py-2 text-[13px] font-semibold text-signal hover:text-signal-hover transition-colors"
          >
            New analysis
          </button>
        </div>
      )}

      <StatsBoxes stats={result.stats} />

      {sections.map(({ config, clusters }) => (
        <TicketSection key={config.kind} config={config} clusters={clusters} />
      ))}

      {/* Upsell */}
      <div className="w-full border border-dashed border-line rounded-card bg-surface px-5 py-5 sm:px-6 flex flex-col items-center gap-4">
        <p className="text-sm font-semibold text-ink text-center">
          This was a one-time snapshot. With the full pipeline, this runs continuously:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 w-full max-w-[640px]">
          {UPSELL_BULLETS.map(([title, rest]) => (
            <div key={title} className="flex items-start gap-2.5">
              <svg className="w-3.5 h-3.5 text-signal mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[12.5px] leading-relaxed text-ink-dim">
                <strong className="text-ink font-semibold">{title}</strong> — {rest}
              </span>
            </div>
          ))}
        </div>

        {/* Original destination, kept here so restoring it is a copy-paste:
              href="https://feedloop.dev" target="_blank" rel="noopener noreferrer"
              label: "Try the full pipeline — 14 days free →"
            Swap back once feedloop.dev can actually start a trial. The label
            changed with it: promising "14 days free" while the only thing on
            offer is a waitlist is the kind of small lie a technical buyer
            notices, and it is not worth the click it buys. */}
        <a href="/full"
          // Only from a run the visitor performed. On a shared /r/[id] page no
          // landed/ran_*/reached_results fires, so counting the click there
          // would push resultsToTrial above 1.0. Measuring the share loop needs
          // its own funnel, not this one.
          // If this click rotated an idled-out session, re-establish the fact
          // that the visitor is on the results view before counting the click —
          // otherwise a >30-min think-then-convert becomes a false orphan.
          onClick={() => {
            if (!readOnly) track("clicked_trial", { newSessionBackfill: ["viewed_cached_results"] });
          }}
          className="mt-1 flex items-center gap-2 px-5 py-2.5 bg-signal rounded-control text-[13px] font-semibold text-signal-on shadow-card hover:bg-signal-hover transition-colors">
          See the full pipeline →
        </a>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 py-1 text-xs text-ink-muted">
        <span>Decoded by FeedLoop</span>
        <span>·</span>
        {/* FIXME(link): github.com/feedloop is NOT ours. It is an unrelated
            Indonesian company (feedloop.ai) with ~20 repos — Batiq, Qore SDK,
            Envoy, Qhronos — none of them a self-hostable feedback tool.

            So this footer makes a claim we cannot honor AND sends warm traffic
            to a namesake. Highest priority of the three link TODOs: the other
            two point at our own empty page, this one points at someone else's
            company. Repoint to the real org once it exists, or drop the
            self-host claim until there is something to self-host. */}
        <a href="https://github.com/feedloop" target="_blank" rel="noopener noreferrer" className="text-signal hover:text-signal-hover">
          Self-host for free: github.com/feedloop
        </a>
      </div>
    </div>
  );
}
