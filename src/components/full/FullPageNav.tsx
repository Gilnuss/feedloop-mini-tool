/**
 * Topbar for /full — the same dashboard chrome as the tool, so moving between
 * them does not feel like leaving the product.
 *
 * The in-page anchors are the only navigation. There is deliberately no outbound
 * link: feedloop.dev has no account to open yet, and a link to an empty app
 * sitting beside a signup form is a leak at the exact point the page converts.
 *
 * TODO(domain): when the app ships, add "Sign in" here pointing at the real app
 * URL. A returning customer needs that escape hatch; a prospect does not.
 */

import Link from "next/link";

export function FullPageNav() {
  return (
    <header className="flex items-center gap-2.5 h-14 px-4 sm:px-6 bg-surface border-b border-line shrink-0">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-panel bg-signal shrink-0">
          <span className="w-[9px] h-[9px] rounded-full border-2 border-white" />
        </span>
        <span className="text-base font-semibold text-ink tracking-[-0.01em]">
          FeedLoop
        </span>
      </Link>

      <span className="px-2 py-0.5 rounded-full bg-signal-bg border border-signal-border text-signal-text font-mono text-[11px] font-semibold uppercase tracking-[0.04em]">
        Full pipeline
      </span>

      <div className="ml-auto flex items-center gap-4">
        <a href="#how-it-works" className="hidden sm:inline text-[13px] text-ink-dim hover:text-ink transition-colors">
          How it works
        </a>
        <a href="#pricing" className="hidden sm:inline text-[13px] text-ink-dim hover:text-ink transition-colors">
          Pricing
        </a>
        <a
          href="#talk-to-us"
          className="px-3.5 py-1.5 bg-signal rounded-control text-[13px] font-semibold text-white shadow-card hover:bg-signal-hover transition-colors"
        >
          Talk to us
        </a>
      </div>
    </header>
  );
}
