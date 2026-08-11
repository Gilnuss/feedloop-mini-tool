/**
 * Where feedback comes FROM and where tickets go TO.
 *
 * This section exists to answer "does this fit my stack" without the visitor
 * having to ask. Split by direction rather than shown as one undifferentiated
 * logo wall — a buyer is checking two different boxes, and a merged list makes
 * them work out which name is which.
 */

export interface WorkflowIntegration {
  name: string;
  /** false = named on the roadmap, not shipped. Never render these as live. */
  isAvailable: boolean;
}

export const FEEDBACK_INTAKE_INTEGRATIONS: WorkflowIntegration[] = [
  { name: "Website widget", isAvailable: true },
  { name: "Intercom", isAvailable: true },
  { name: "Zendesk", isAvailable: true },
  { name: "App Store reviews", isAvailable: true },
  { name: "Google Play reviews", isAvailable: true },
  { name: "Slack", isAvailable: false },
  { name: "CSV import", isAvailable: true },
];

export const TICKET_DESTINATION_INTEGRATIONS: WorkflowIntegration[] = [
  { name: "Linear", isAvailable: true },
  { name: "Jira", isAvailable: true },
  { name: "GitHub Issues", isAvailable: true },
  { name: "Notion", isAvailable: false },
  { name: "Coding agent handoff", isAvailable: false },
];
