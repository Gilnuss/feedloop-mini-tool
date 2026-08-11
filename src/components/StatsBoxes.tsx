"use client";

import type { DecodeStats } from "@/lib/types";

/**
 * Only `issues` carries the accent. Four differently-coloured numbers is a
 * scoreboard; one accented number is a headline — and the issue count is the
 * one figure the whole tool exists to produce.
 */
const STATS_CONFIG = [
  { key: "inputCount", label: "inputs", isAccented: false },
  { key: "issueCount", label: "issues", isAccented: true },
  { key: "duplicateCount", label: "dupes merged", isAccented: false },
  { key: "hoursSaved", label: "saved", isAccented: false, prefix: "~", suffix: "h" },
] as const;

export function StatsBoxes({ stats }: { stats: DecodeStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
      {STATS_CONFIG.map((cfg) => {
        const val = stats[cfg.key as keyof DecodeStats];
        const display = typeof val === "number"
          ? `${("prefix" in cfg ? cfg.prefix : "")}${val}${("suffix" in cfg ? cfg.suffix : "")}`
          : String(val);

        return (
          <div
            key={cfg.key}
            className="flex flex-col gap-0.5 bg-surface border border-line rounded-card shadow-card px-4 py-3.5"
          >
            <span
              className={`font-mono font-bold text-2xl sm:text-[28px] tracking-[-0.02em] tabular-nums ${
                cfg.isAccented ? "text-signal" : "text-ink"
              }`}
            >
              {display}
            </span>
            <span className="text-[12.5px] text-ink-dim">{cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}
