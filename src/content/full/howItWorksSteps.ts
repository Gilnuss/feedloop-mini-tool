/**
 * The three-step mechanism, in the order a customer experiences it.
 *
 * Shape borrowed from hio.ai's Connect → Works → Approve sequence. The load
 * bearing part is that step three is an APPROVAL, not a completion: an AI that
 * files tickets into your tracker unsupervised reads as a risk, the same thing
 * with a human gate reads as leverage. Do not collapse it into two steps.
 */

export interface HowItWorksStep {
  stepNumber: number;
  title: string;
  description: string;
  /** Concrete artifact the visitor can picture — keep it specific, never generic. */
  outcome: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    stepNumber: 1,
    title: "Connect your feedback",
    description:
      "Drop the widget on your site, or connect the places feedback already piles up — Intercom, Zendesk, App Store reviews, a Slack channel.",
    outcome: "Nothing to train. It reads what comes in.",
  },
  {
    stepNumber: 2,
    title: "FeedLoop does the sorting",
    description:
      "Duplicates merge, related reports cluster into one issue, and vague complaints get a clarifying question sent back to the user who wrote them.",
    outcome: "\"App is broken\" becomes a reproducible bug with a device and a version.",
  },
  {
    stepNumber: 3,
    title: "You approve, it ships",
    description:
      "Each ticket arrives written up with acceptance criteria and severity. Approve it and it lands in your tracker — or hand it straight to a coding agent.",
    outcome: "A real Linear issue, in your team's format, with the reports attached.",
  },
];
