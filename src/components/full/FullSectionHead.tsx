/**
 * Eyebrow + title + optional sub, left-aligned above each /full section.
 *
 * Lives in its own file rather than being repeated inline four times: it is the
 * rhythm that makes the page scan as one document, and four hand-copied versions
 * would drift apart the first time anyone adjusted a margin. Scoped to /full —
 * nothing outside this folder imports it.
 */

export function FullSectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {eyebrow}
      </span>
      <h2 className="text-[22px] font-semibold text-ink tracking-[-0.02em]">
        {title}
      </h2>
      {sub && (
        <p className="text-sm leading-relaxed text-ink-dim max-w-[620px]">{sub}</p>
      )}
    </div>
  );
}
