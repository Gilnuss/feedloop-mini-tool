"use client";

/**
 * ⚠️ NOT RENDERED — nothing imports this component.
 *
 * Kept because the breakdown it draws is real data the pipeline already
 * produces (stats.byType / stats.bySeverity) and the results page may want it
 * back. It was restyled onto the design tokens along with everything else so
 * that wiring it up later is a one-line import rather than a second restyle.
 */

import type { DecodeStats } from "@/lib/types";

const TYPE_BAR_COLORS: Record<string, string> = {
  bug: "bg-kind-bug-dot",
  feature: "bg-kind-feature-dot",
  feedback: "bg-kind-epic-dot",
};

const SEVERITY_BAR_COLORS: Record<string, string> = {
  critical: "bg-sev-critical-dot",
  high: "bg-sev-high-dot",
  medium: "bg-sev-medium-dot",
  low: "bg-sev-low-dot",
};

function BarChart({
  data,
  colors,
  total,
}: {
  data: Record<string, number>;
  colors: Record<string, string>;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(data).map(([key, count]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-ink-dim w-16 text-right capitalize">
            {key}
          </span>
          <div className="flex-1 h-4 bg-raised rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colors[key] || "bg-ink-muted"}`}
              style={{ width: `${Math.max((count / total) * 100, 2)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-ink-dim w-8 tabular-nums">{count}</span>
        </div>
      ))}
    </div>
  );
}

export function BreakdownCharts({ stats }: { stats: DecodeStats }) {
  const total = stats.inputCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          By type
        </span>
        <BarChart data={stats.byType} colors={TYPE_BAR_COLORS} total={total} />
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          By severity
        </span>
        <BarChart data={stats.bySeverity} colors={SEVERITY_BAR_COLORS} total={total} />
      </div>
    </div>
  );
}
