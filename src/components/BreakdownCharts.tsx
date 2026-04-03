"use client";

import type { DecodeStats } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  bug: "bg-red-500",
  feature: "bg-yellow-500",
  feedback: "bg-purple-500",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
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
          <span className="text-xs text-zinc-500 w-16 text-right capitalize">
            {key}
          </span>
          <div className="flex-1 h-5 bg-[#1A1A1A] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colors[key] || "bg-zinc-600"}`}
              style={{ width: `${Math.max((count / total) * 100, 2)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 w-8">{count}</span>
        </div>
      ))}
    </div>
  );
}

export function BreakdownCharts({ stats }: { stats: DecodeStats }) {
  const total = stats.inputCount;

  return (
    <div className="grid grid-cols-2 gap-8 w-full max-w-[800px]">
      <div>
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          By Type
        </h4>
        <BarChart data={stats.byType} colors={TYPE_COLORS} total={total} />
      </div>
      <div>
        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          By Severity
        </h4>
        <BarChart data={stats.bySeverity} colors={SEVERITY_COLORS} total={total} />
      </div>
    </div>
  );
}
