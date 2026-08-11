/**
 * The pricing section, with no prices in it.
 *
 * FeedLoop is priced per client, so this section's job is the opposite of a
 * normal pricing page: give a visitor enough to judge whether they are the right
 * size to talk to us, while publishing nothing that would anchor a negotiation.
 *
 * No CTA here — the form is the very next thing on the page, so a button whose
 * only job is to scroll past one section is noise.
 */

import {
  PRICING_FACTORS,
  PRICING_APPROACH_HEADING,
  PRICING_APPROACH_EXPLANATION,
} from "@/content/full/pricingApproach";
import { FullSectionHead } from "./FullSectionHead";

export function PricingApproach() {
  return (
    <section id="pricing" className="w-full scroll-mt-20">
      <FullSectionHead
        eyebrow="Pricing"
        title={PRICING_APPROACH_HEADING}
        sub={PRICING_APPROACH_EXPLANATION}
      />

      {/* Two columns, not three — the intake-sources factor was removed, and a
          3-column grid holding 2 cards leaves a hole that reads as a mistake.
          Revisit this number if a factor is ever added back. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRICING_FACTORS.map((factor) => (
          <div
            key={factor.title}
            className="flex flex-col gap-1.5 bg-surface border border-line rounded-card shadow-card px-4.5 py-4"
          >
            <h3 className="text-[14.5px] font-semibold text-ink">{factor.title}</h3>
            <p className="text-[13px] leading-relaxed text-ink-dim">
              {factor.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
