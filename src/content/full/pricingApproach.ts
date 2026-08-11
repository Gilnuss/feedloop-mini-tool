/**
 * What we say about pricing instead of a price.
 *
 * Deliberate decision: FeedLoop is priced per client, so no number appears on
 * this page. A public figure would anchor every negotiation against the one
 * team it happened to fit, and unpick nothing when it does not.
 *
 * What IS published is the shape of the estimate. "Contact us" with no context
 * reads as "enterprise, expensive, don't bother" and silently loses buyers who
 * would have qualified — naming the three variables lets a visitor place
 * themselves without ever seeing a figure.
 *
 * See components/full/PricingApproach.tsx. The superseded tier table with its
 * placeholder numbers is retained, unrendered, in ./pricingTiers.ts.
 */

export interface PricingFactor {
  title: string;
  description: string;
}

export const PRICING_FACTORS: PricingFactor[] = [
  {
    title: "How much feedback you get",
    description:
      "A few hundred reports a month and a few hundred thousand are different systems. We size to yours.",
  },
  {
    title: "How deep the tickets go",
    description:
      "Clustered issues, full PRDs with root cause, or tickets handed straight to a coding agent.",
  },
];

export const PRICING_APPROACH_HEADING = "Pricing is built around your setup";

export const PRICING_APPROACH_EXPLANATION =
  "No two teams send us the same feedback in the same volume — so we quote per team rather than publish a number that would be wrong for most of them. Tell us what your setup looks like and we will come back with a real figure.";
