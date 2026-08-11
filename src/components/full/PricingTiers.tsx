/**
 * Pricing, on the page rather than behind a nav link.
 *
 * hio.ai can afford to hide pricing one click away because its traffic arrives
 * cold and needs convincing first. This page is read by someone already sold on
 * the mechanism, and most SaaS visitors go looking for pricing before anything
 * else — making them hunt for it here loses the ones furthest down the funnel.
 *
 * ⚠️ The numbers rendered here are PLACEHOLDERS. See content/full/pricingTiers.ts.
 */

import { PRICING_TIERS } from "@/content/full/pricingTiers";
import type { PricingTier } from "@/content/full/pricingTiers";
import {
  ANNUAL_BILLING_DISCOUNT_LABEL,
  NO_CREDIT_CARD_NOTE,
} from "@/content/full/pricingTiers";

function formatTierPrice(tier: PricingTier): string {
  if (tier.monthlyPriceUsd === null) return "Free";
  return `$${tier.monthlyPriceUsd}`;
}

function PricingTierCard({ tier }: { tier: PricingTier }) {
  const borderStyle = tier.isRecommended
    ? "border-signal-border"
    : "border-line";

  return (
    <div
      className={`relative flex flex-col gap-4 bg-surface border ${borderStyle} rounded-card shadow-card p-5`}
    >
      {tier.isRecommended && (
        <span className="absolute -top-2.5 left-5 px-2 py-0.5 rounded-full bg-signal text-[10px] font-mono uppercase tracking-wider text-white">
          Recommended
        </span>
      )}

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-ink">{tier.name}</h3>
        <p className="text-[13px] text-ink-dim">{tier.tagline}</p>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-ink">{formatTierPrice(tier)}</span>
        {tier.monthlyPriceUsd !== null && (
          <span className="text-sm text-ink-dim">/ month</span>
        )}
      </div>

      <div className="flex flex-col gap-1 pb-3 border-b border-line-subtle">
        <span className="text-[13px] font-mono text-signal">
          {tier.monthlyItemAllowance}
        </span>
        <span className="text-[13px] text-ink-dim">{tier.includedSeats}</span>
      </div>

      <ul className="flex flex-col gap-2">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-[13px] text-ink-dim">
            <span className="text-signal mt-0.5">✦</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href="#early-access"
        className={`mt-auto flex items-center justify-center px-4 py-2.5 rounded-control text-sm font-semibold transition-colors ${
          tier.isRecommended
            ? "bg-signal text-white hover:bg-signal-hover shadow-card"
            : "bg-surface border border-line text-ink-dim hover:text-ink hover:bg-raised"
        }`}
      >
        {tier.callToActionLabel}
      </a>
    </div>
  );
}

export function PricingTiers() {
  return (
    <section className="w-full flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink">Pricing</h2>
        <p className="text-sm text-ink-dim">
          Priced on feedback items processed — the same items you just counted.
        </p>
        <p className="text-[13px] text-ink-muted">
          {ANNUAL_BILLING_DISCOUNT_LABEL} · {NO_CREDIT_CARD_NOTE}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRICING_TIERS.map((tier) => (
          <PricingTierCard key={tier.name} tier={tier} />
        ))}
      </div>

      {/* Honesty about what is actually purchasable today. Presenting paid tiers
          for an app that has not shipped is only defensible while this is said
          plainly and out loud — remove it when feedloop.dev goes live, not before. */}
      <p className="text-[13px] text-ink-dim text-center max-w-[560px] mx-auto">
        FeedLoop is in early access — the paid plans above are not billable yet.
        Join the founding cohort and you will keep founding pricing when they are.
      </p>
    </section>
  );
}
