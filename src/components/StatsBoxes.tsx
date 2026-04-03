"use client";

import type { DecodeStats } from "@/lib/types";

const STATS_CONFIG = [
  { key: "inputCount", label: "inputs", color: "text-white" },
  { key: "issueCount", label: "issues", color: "text-purple-400" },
  { key: "duplicateCount", label: "dupes merged", color: "text-pink-400" },
  { key: "hoursSaved", label: "saved", color: "text-green-400", prefix: "~", suffix: "h" },
] as const;

export function StatsBoxes({ stats }: { stats: DecodeStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-[800px]">
      {STATS_CONFIG.map((cfg) => {
        const val = stats[cfg.key as keyof DecodeStats];
        const display = typeof val === "number"
          ? `${("prefix" in cfg ? cfg.prefix : "")}${val}${("suffix" in cfg ? cfg.suffix : "")}`
          : String(val);

        return (
          <div
            key={cfg.key}
            className="flex flex-col items-center gap-1 bg-[#141414] border border-[#27272A] rounded-xl py-4 sm:py-5 px-3 sm:px-4"
          >
            <span className={`font-mono font-bold text-2xl sm:text-3xl ${cfg.color}`}>
              {display}
            </span>
            <span className="text-xs sm:text-[13px] text-zinc-500">{cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}
