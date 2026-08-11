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

type StageState = "done" | "active" | "pending";

/**
 * Filled check, spinning ring, or empty outline. Three visually distinct states
 * rather than three emoji — the emoji rendered at different optical sizes per
 * platform, which made the checklist look ragged.
 */
function StageMarker({ state }: { state: StageState }) {
  if (state === "done") {
    return (
      <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-signal-subtle shrink-0">
        <svg className="w-2.5 h-2.5 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (state === "active") {
    return (
      <span className="inline-block w-[18px] h-[18px] rounded-full border-2 border-signal border-t-transparent animate-spin shrink-0" />
    );
  }

  return (
    <span className="inline-block w-[18px] h-[18px] rounded-full border-[1.5px] border-line shrink-0" />
  );
}

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
    <div className="flex flex-col items-center w-full max-w-[560px]">
      <div className="w-full bg-surface border border-line rounded-card shadow-card px-6 pt-6 pb-5">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-2 h-2 rounded-full bg-signal" />
          <h2 className="text-[17px] font-semibold text-ink tracking-[-0.01em]">
            Decoding your feedback
          </h2>
          <span className="ml-auto font-mono text-[13px] font-semibold text-ink tabular-nums">
            {progress}%
          </span>
        </div>

        <div className="relative h-1 rounded-full bg-raised overflow-hidden mb-6">
          <div
            className="absolute inset-y-0 left-0 bg-signal rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-col gap-0.5">
          {STAGES.map((s, i) => {
            const state: StageState =
              stage === "done" || i < currentStageIndex
                ? "done"
                : i === currentStageIndex
                  ? "active"
                  : "pending";

            return (
              <div
                key={s.key}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-control ${
                  state === "active" ? "bg-signal-bg" : ""
                }`}
              >
                <StageMarker state={state} />

                <span
                  className={`text-[13.5px] ${
                    state === "pending"
                      ? "font-normal text-ink-muted"
                      : "font-medium text-ink"
                  }`}
                >
                  {s.label}
                </span>

                <span
                  className={`ml-auto font-mono text-[11.5px] ${
                    state === "active" ? "text-signal" : "text-ink-muted"
                  }`}
                >
                  {state === "done" ? "done" : state === "active" ? detail : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2.5 mt-5 px-1.5 max-w-[460px]">
        <svg className="w-3.5 h-3.5 text-ink-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <p className="text-[13px] leading-relaxed text-ink-dim">
          {INSIGHTS[insightIndex]}
        </p>
      </div>
    </div>
  );
}
