/**
 * Product topbar — the dashboard's chrome, so the tool reads as part of FeedLoop
 * rather than as a separate site.
 *
 * Mark + wordmark + a "Decode" pill naming which surface you are on. Extracted
 * from page.tsx when the restyle landed, because the same bar now has to appear
 * on the results screen and the shared read-only view too.
 */

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function DecodeTopbar({
  right,
  label = "Decode",
}: {
  right?: ReactNode;
  /** Names the surface. "Shared result" on the read-only /r/[id] view. */
  label?: string;
}) {
  return (
    <header className="flex items-center gap-2.5 h-14 px-4 sm:px-6 bg-surface border-b border-line shrink-0">
      <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-panel bg-signal shrink-0">
        <span className="w-[9px] h-[9px] rounded-full border-2 border-white" />
      </span>

      <span className="text-base font-semibold text-ink tracking-[-0.01em]">
        FeedLoop
      </span>

      <span className="px-2 py-0.5 rounded-full bg-signal-bg border border-signal-border text-signal-text font-mono text-[11px] font-semibold uppercase tracking-[0.04em]">
        {label}
      </span>

      <div className="ml-auto flex items-center gap-3.5">
        {right}

        <ThemeToggle />

        {/* TODO(domain): feedloop.dev is the PRODUCT app (login/dashboard), not a
            marketing site — as of Aug 2026 it still serves the bare Vite scaffold,
            so this link currently lands on an empty page.

            Two things to fix when the app ships:
              1. Point this at the real app URL. The label is already the action
                 ("Open FeedLoop") rather than a bare domain, which is what it
                 should say once there is something on the other side.
              2. Reconsider whether it belongs on the INPUT screen at all. Before
                 a visitor has run a decode there is nothing to sign in to and
                 nothing to be sold on, so this is a pure funnel leak sitting
                 above the primary CTA. Outbound links belong on the results
                 screen and /full, after the value moment. */}
        <a
          href="https://feedloop.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-medium text-signal hover:text-signal-hover transition-colors"
        >
          Open FeedLoop →
        </a>
      </div>
    </header>
  );
}
