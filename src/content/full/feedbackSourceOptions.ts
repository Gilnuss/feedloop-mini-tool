/**
 * The single qualifying question asked at signup.
 *
 * One question, not a form. Asking for company size or job title on top of an
 * email costs up to a third of conversions, and neither answer would change
 * what gets built next — this one does. The distribution of answers IS the
 * integration roadmap, ordered by demand, bought for the price of one dropdown.
 *
 * It also raises the cost of the signal above a click. A click is half a second
 * of curiosity; picking the tool your feedback actually lives in is a statement
 * about your workflow, and that is the thing worth measuring at this stage.
 */

export interface FeedbackSourceOption {
  /** Stored value — keep stable, this is what gets aggregated. */
  id: string;
  label: string;
}

export const FEEDBACK_SOURCE_OPTIONS: FeedbackSourceOption[] = [
  { id: "intercom", label: "Intercom" },
  { id: "zendesk", label: "Zendesk" },
  { id: "slack", label: "A Slack channel" },
  { id: "app_store_reviews", label: "App Store / Play reviews" },
  { id: "github_issues", label: "GitHub Issues" },
  { id: "spreadsheet", label: "A spreadsheet" },
  { id: "email_inbox", label: "An email inbox" },
  { id: "nowhere", label: "Nowhere — it gets lost" },
  { id: "other", label: "Something else" },
];

export const FEEDBACK_SOURCE_OPTION_IDS: string[] = FEEDBACK_SOURCE_OPTIONS.map(
  (option) => option.id,
);
