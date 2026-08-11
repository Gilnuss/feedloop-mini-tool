/**
 * The one comparison that replaces hio.ai's three separate persuasion sections.
 *
 * A cold landing page needs those three because it is arguing from zero. This
 * page is read by someone who just watched their own feedback get decoded, so
 * the only open question is what changes when it runs continuously instead of
 * once. Everything here is that delta — nothing that re-sells the demo.
 *
 * Source: the upsell bullets in components/ResultsDashboard.tsx, rewritten as
 * before/after pairs so the gap is visible rather than asserted.
 */

export interface SnapshotVsContinuousRow {
  capability: string;
  inTheDemo: string;
  inTheFullPipeline: string;
}

export const SNAPSHOT_VS_CONTINUOUS_ROWS: SnapshotVsContinuousRow[] = [
  {
    capability: "Getting feedback in",
    inTheDemo: "You paste it, one batch at a time",
    inTheFullPipeline: "Widget and integrations collect it around the clock",
  },
  {
    capability: "Vague reports",
    inTheDemo: "Stay vague — there is no one to ask",
    inTheFullPipeline: "A clarifying question goes back to the user who wrote it",
  },
  {
    capability: "Ticket depth",
    inTheDemo: "Title, summary, acceptance criteria",
    inTheFullPipeline: "Full PRD with root cause and developer constraints",
  },
  {
    capability: "Duplicates across time",
    inTheDemo: "Merged within the batch you pasted",
    inTheFullPipeline: "Merged against everything ever reported",
  },
  {
    capability: "Where tickets land",
    inTheDemo: "A page you can copy from",
    inTheFullPipeline: "Linear, Jira or GitHub, in your team's format",
  },
  {
    capability: "From ticket to fix",
    inTheDemo: "You take it from here",
    inTheFullPipeline: "Hand it to a coding agent that opens the PR",
  },
];
