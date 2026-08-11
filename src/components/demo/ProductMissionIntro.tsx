/**
 * "What is this" block above the demo input.
 *
 * The eyebrow carries the framing ("free sample") so the h1 underneath can stay
 * a pure instruction. Keeping context and action in separate registers is what
 * stops the page reading as two competing headlines.
 */

import { MISSION_HEADLINE, MISSION_DETAIL } from "@/content/demo/productMissionIntro";

export function ProductMissionIntro() {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center max-w-[560px]">
      {/* Desktop only. It says nothing the footer's "No signup required · Your
          data is never stored" does not already say, and on a phone those ~26px
          are the difference between the Decode button clearing the fold on a
          small handset and sitting just under it. */}
      <span className="hidden sm:block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        Free sample · one batch, no signup
      </span>

      <p className="text-[13px] sm:text-sm text-ink-dim leading-relaxed">
        {MISSION_HEADLINE}
      </p>

      {/* Hidden on small screens to keep the decode button above the fold. */}
      <p className="hidden sm:block text-[13px] text-ink-muted">{MISSION_DETAIL}</p>
    </div>
  );
}
