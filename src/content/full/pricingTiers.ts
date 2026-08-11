/**
 * ⚠️ NOT RENDERED. Retained on purpose — do not wire this back in casually. ⚠️
 *
 * FeedLoop is priced per client, so /full publishes no numbers at all. The live
 * section is components/full/PricingApproach.tsx, which names what shapes a
 * quote without naming a figure. This file is kept only because the tier shapes
 * are a useful starting point if self-serve pricing is ever introduced — every
 * number in it is a placeholder that was never validated against a real deal.
 *
 * Rendering this again is a pricing strategy decision, not a code change.
 *
 * ── original header follows ──
 *
 * Every `monthlyPriceUsd` marked PLACEHOLDER is a guess and must be replaced.
 * Publishing specific numbers is the point (vague pricing lengthens sales
 * cycles and filters out serious buyers), but wrong numbers anchor a market
 * badly and are expensive to walk back.
 *
 * Metering unit: FEEDBACK ITEMS PER MONTH, deliberately not "AI credits".
 * hio.ai meters in credits, which is opaque — nobody knows what a credit buys.
 * The demo has already taught every visitor what one item is ("30 items
 * detected" in components/FeedbackInput.tsx), so items are the one unit this
 * audience can already price themselves against.
 *
 * The free tier is a genuine founding-cohort offer, not a fake door: it is the
 * honest way to sell an early-access product, and it must stay claimable for
 * real while the app at feedloop.dev is still being built.
 */

export interface PricingTier {
  name: string;
  /** null = free. Any number here is a PLACEHOLDER until product sets it. */
  monthlyPriceUsd: number | null;
  tagline: string;
  monthlyItemAllowance: string;
  includedSeats: string;
  features: string[];
  isRecommended: boolean;
  callToActionLabel: string;
}

/** Annual billing discount, mirroring the standard SaaS 20%. PLACEHOLDER. */
export const ANNUAL_BILLING_DISCOUNT_LABEL = "Save 20% billed annually";

/** Attached to every CTA — removing card friction is the single biggest lever. */
export const NO_CREDIT_CARD_NOTE = "No credit card required";

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Founding",
    monthlyPriceUsd: null,
    tagline: "Free while we build the first cohort",
    monthlyItemAllowance: "200 items / month",
    includedSeats: "1 seat",
    features: [
      "Paste and CSV import",
      "Clustering, dedup and severity",
      "Shareable result links",
      "Founding pricing locked in for life",
    ],
    isRecommended: false,
    callToActionLabel: "Join the founding cohort",
  },
  {
    name: "Starter",
    monthlyPriceUsd: 39, // PLACEHOLDER
    tagline: "For a team shipping against real user reports",
    monthlyItemAllowance: "2,000 items / month",
    includedSeats: "1 seat",
    features: [
      "Everything in Founding",
      "Website feedback widget",
      "One ticket destination",
      "Clarifying questions back to users",
    ],
    isRecommended: false,
    callToActionLabel: "Get early access",
  },
  {
    name: "Team",
    monthlyPriceUsd: 119, // PLACEHOLDER
    tagline: "For a product team that lives in the tracker",
    monthlyItemAllowance: "10,000 items / month",
    includedSeats: "3 seats",
    features: [
      "Everything in Starter",
      "All intake sources and destinations",
      "Full PRDs with root cause",
      "Cross-time duplicate merging",
    ],
    isRecommended: true,
    callToActionLabel: "Get early access",
  },
  {
    name: "Scale",
    monthlyPriceUsd: 319, // PLACEHOLDER
    tagline: "For several products under one roof",
    monthlyItemAllowance: "50,000 items / month",
    includedSeats: "10 seats",
    features: [
      "Everything in Team",
      "Multiple workspaces",
      "Coding agent handoff",
      "Priority support",
    ],
    isRecommended: false,
    callToActionLabel: "Talk to us",
  },
];
