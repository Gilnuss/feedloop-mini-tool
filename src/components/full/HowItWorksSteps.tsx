/**
 * The three-step mechanism section.
 *
 * This is the section that answers the question the demo cannot: what actually
 * happens between a user complaining and a ticket existing. Numbered and
 * ordered — a grid of feature cards would lose the sequence, and the sequence
 * is the explanation.
 *
 * The outcome line sits below a divider at the bottom of each card, pinned with
 * mt-auto so the three dividers align no matter how the descriptions wrap.
 */

import { HOW_IT_WORKS_STEPS } from "@/content/full/howItWorksSteps";
import { FullSectionHead } from "./FullSectionHead";

export function HowItWorksSteps() {
  return (
    <section id="how-it-works" className="w-full scroll-mt-20">
      <FullSectionHead eyebrow="How it works" title="Three steps, one of them yours" />

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <li
            key={step.stepNumber}
            className="flex flex-col gap-2.5 bg-surface border border-line rounded-card shadow-card px-4.5 pt-4.5 pb-4"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-pill bg-signal-bg border border-signal-border text-signal-text font-mono text-xs font-bold">
              {step.stepNumber}
            </span>

            <h3 className="text-[15px] font-semibold text-ink">{step.title}</h3>

            <p className="text-[13px] leading-relaxed text-ink-dim">
              {step.description}
            </p>

            <p className="mt-auto pt-3 border-t border-line-subtle text-[12.5px] leading-snug text-ink">
              {step.outcome}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
