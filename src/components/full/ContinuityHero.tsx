/**
 * Opening section of /full.
 *
 * Its whole job is continuity: this reader arrives having just seen their own
 * feedback decoded, so the page must pick up mid-thought rather than restart
 * the pitch. Quoting their actual numbers back does that in one line and costs
 * nothing — the run is already in localStorage.
 */

"use client";

import { useLastDecodeSummary } from "@/hooks/useLastDecodeSummary";

function describeWhatJustHappened(
  summary: ReturnType<typeof useLastDecodeSummary>,
): string {
  if (!summary) {
    return "You just watched messy feedback turn into a set of real tickets.";
  }

  return `You just turned ${summary.inputCount} pieces of feedback into ${summary.issueCount} tickets.`;
}

export function ContinuityHero() {
  const summary = useLastDecodeSummary();

  return (
    <section className="flex flex-col items-center gap-3.5 text-center pt-2">
      <span className="px-2.5 py-1 rounded-full bg-signal-bg border border-signal-border text-signal-text font-mono text-[11px] font-semibold uppercase tracking-[0.06em]">
        The full pipeline
      </span>

      <h1 className="text-[30px] sm:text-[38px] font-bold text-ink leading-[1.14] tracking-[-0.025em] max-w-[700px] text-balance">
        {describeWhatJustHappened(summary)}
        <br />
        <span className="text-ink-muted">That was one snapshot.</span>
      </h1>

      <p className="text-[15px] sm:text-[15.5px] leading-relaxed text-ink-dim max-w-[560px]">
        FeedLoop knows every report your users have ever sent, which ones are the
        same problem, and which one to fix next. Running every day, into the
        tracker your team already uses.
      </p>
    </section>
  );
}
