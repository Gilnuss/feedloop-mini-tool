/**
 * /full — the post-demo page.
 *
 * Reached from the results screen, never before it. Ordering matters and is the
 * one thing not to rearrange casually:
 *
 *   1. hero          pick up mid-thought from the run they just watched
 *   2. how it works  the mechanism the demo cannot show
 *   3. integrations  "does this fit my stack", answered before it is asked
 *   4. comparison    what continuous actually buys over a snapshot
 *   5. pricing       how a quote is shaped — no figures, priced per client
 *   6. talk to us    the terminal step
 *
 * Adapted from hio.ai's structure, cut roughly in half. That page runs eleven
 * sections because it argues from zero to a cold visitor; this one is read by
 * someone who has already seen the product work on their own data, so the
 * persuasion sections are redundant and the mechanism sections are not.
 */

import type { Metadata } from "next";
import { FullPageNav } from "@/components/full/FullPageNav";
import { ContinuityHero } from "@/components/full/ContinuityHero";
import { HowItWorksSteps } from "@/components/full/HowItWorksSteps";
import { WorkflowIntegrations } from "@/components/full/WorkflowIntegrations";
import { SnapshotVsContinuous } from "@/components/full/SnapshotVsContinuous";
import { PricingApproach } from "@/components/full/PricingApproach";
import { EarlyAccessForm } from "@/components/full/EarlyAccessForm";

export const metadata: Metadata = {
  title: "FeedLoop — feedback in, tickets out, every day",
  description:
    "The decode tool was a snapshot. See how the full pipeline runs continuously: widget and integrations in, clarifying questions back to users, finished tickets into Linear, Jira or GitHub.",
};

export default function FullPipelinePage() {
  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      <FullPageNav />

      <div className="flex-1 flex justify-center px-4 sm:px-8 py-8 sm:py-9">
        <div className="flex flex-col items-center gap-10 sm:gap-11 w-full max-w-[860px]">
          <ContinuityHero />
          <HowItWorksSteps />
          <WorkflowIntegrations />
          <SnapshotVsContinuous />
          <PricingApproach />

          {/* Testimonial slot — intentionally empty until there is a real customer
              to quote. hio.ai earns a lot from its single testimonial, but an
              invented or placeholder one on a page whose entire job is trust is
              worse than the gap it fills. Add it here when it is true. */}

          <EarlyAccessForm />
        </div>
      </div>
    </main>
  );
}
