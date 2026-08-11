/**
 * The one comparison section, replacing hio.ai's three persuasion blocks.
 *
 * Renders as a real table on desktop and as stacked pairs on mobile — a table
 * that scrolls sideways on a phone hides the right-hand column, which is the
 * only column that matters here.
 *
 * The check mark appears on the full-pipeline side only. Ticking both columns
 * would say the two are equivalent, which is the opposite of the point.
 */

import { SNAPSHOT_VS_CONTINUOUS_ROWS } from "@/content/full/snapshotVsContinuousRows";
import { FullSectionHead } from "./FullSectionHead";

const COLUMN_GRID = "sm:grid sm:grid-cols-[1.1fr_1fr_1.2fr] sm:items-center";

export function SnapshotVsContinuous() {
  return (
    <section className="w-full">
      <FullSectionHead
        eyebrow="Snapshot vs continuous"
        title="What changes when it runs every day"
      />

      <div className="w-full bg-surface border border-line rounded-card shadow-card overflow-hidden">
        <div className={`hidden ${COLUMN_GRID} bg-raised px-5 py-2.5`}>
          <span className="text-xs font-semibold text-ink-dim">Capability</span>
          <span className="text-xs font-semibold text-ink-dim">In the demo</span>
          <span className="text-xs font-semibold text-signal-text">In the full pipeline</span>
        </div>

        {SNAPSHOT_VS_CONTINUOUS_ROWS.map((row) => (
          <div
            key={row.capability}
            className={`border-t border-line-subtle px-5 py-3 flex flex-col gap-1.5 ${COLUMN_GRID}`}
          >
            <span className="text-[13px] font-medium text-ink sm:pr-3">
              {row.capability}
            </span>

            <span className="text-[13px] text-ink-muted sm:pr-3">
              <span className="sm:hidden font-mono text-[10px] uppercase tracking-[0.08em] block mb-0.5">
                Demo
              </span>
              {row.inTheDemo}
            </span>

            <span className="flex items-start gap-2 text-[13px] text-ink">
              <svg className="w-3.5 h-3.5 text-signal mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {row.inTheFullPipeline}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
