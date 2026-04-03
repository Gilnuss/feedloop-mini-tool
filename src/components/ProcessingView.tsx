"use client";

import { useEffect, useState } from "react";

const STAGES = [
  { key: "scrubbing", label: "Reading feedback" },
  { key: "classifying", label: "Classifying each item" },
  { key: "embedding", label: "Analyzing content" },
  { key: "clustering", label: "Finding patterns & duplicates" },
  { key: "summarizing", label: "Creating actionable tickets" },
];

const INSIGHTS = [
  "34% of user feedback is duplicate. Most teams don't know this.",
  "The average PM spends 6 hours/week triaging feedback manually.",
  "Bug reports outnumber feature requests 2:1 in most SaaS products.",
  "Teams that cluster feedback ship 40% fewer tickets that get reopened.",
  "Most user complaints map to just 5-7 underlying issues.",
];

interface Props {
  stage: string;
  progress: number;
  detail?: string;
}

export function ProcessingView({ stage, progress, detail }: Props) {
  const [insightIndex, setInsightIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setInsightIndex((i) => (i + 1) % INSIGHTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentStageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      <h2 className="text-xl font-semibold text-white">
        Decoding your feedback...
      </h2>

      {/* Stage checklist */}
      <div className="w-full flex flex-col gap-4">
        {STAGES.map((s, i) => {
          const isDone = i < currentStageIndex || stage === "done";
          const isActive = i === currentStageIndex && stage !== "done";
          const isPending = i > currentStageIndex;

          return (
            <div key={s.key} className="flex items-center gap-3">
              <span className="text-base w-6 text-center">
                {isDone ? "✅" : isActive ? "⏳" : "○"}
              </span>
              <span
                className={`text-sm ${isDone ? "text-white" : isActive ? "text-purple-400" : "text-zinc-600"}`}
              >
                {s.label}
              </span>
              {isActive && detail && (
                <span className="text-xs font-mono text-purple-400 ml-auto">
                  {detail}
                </span>
              )}
              {isDone && (
                <span className="text-xs font-mono text-green-400 ml-auto">
                  done
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full flex flex-col gap-2">
        <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-mono text-zinc-500 text-center">
          {progress}%
        </span>
      </div>

      {/* Rotating insight */}
      <p className="text-sm text-zinc-500 italic text-center max-w-sm transition-opacity duration-500">
        &ldquo;{INSIGHTS[insightIndex]}&rdquo;
      </p>
    </div>
  );
}
