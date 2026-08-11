/**
 * Validation for one early-access signup.
 *
 * Deliberately self-contained rather than routed through lib/rateLimit.ts's
 * validateInput — that function validates feedback item arrays and shares
 * nothing with this shape beyond the word "validate". Keeping them apart means
 * neither can be changed into breaking the other.
 */

import { FEEDBACK_SOURCE_OPTION_IDS } from "@/content/full/feedbackSourceOptions";

const MAX_EMAIL_LENGTH = 254; // RFC 5321 practical maximum
const MIN_EMAIL_LENGTH = 6; // a@b.co

/**
 * Intentionally permissive. The only authority on whether an address exists is
 * a delivered message, so anything stricter than "plausibly an address" just
 * rejects real people with unusual domains.
 */
const PLAUSIBLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export interface ValidEarlyAccessSignup {
  emailAddress: string;
  feedbackSourceId: string;
}

export function normalizeEmailAddress(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

export function describeEmailProblem(rawEmail: unknown): string | null {
  if (typeof rawEmail !== "string") return "Email must be text";

  const normalized = normalizeEmailAddress(rawEmail);
  if (normalized.length < MIN_EMAIL_LENGTH) return "That email looks too short";
  if (normalized.length > MAX_EMAIL_LENGTH) return "That email is too long";
  if (!PLAUSIBLE_EMAIL_PATTERN.test(normalized)) return "That does not look like an email address";

  return null;
}

export function describeFeedbackSourceProblem(rawSourceId: unknown): string | null {
  if (typeof rawSourceId !== "string") return "Pick where your feedback lives";
  if (!FEEDBACK_SOURCE_OPTION_IDS.includes(rawSourceId)) return "Unknown feedback source";

  return null;
}

/**
 * Whole-payload check. Returns the signup to store, or the first problem worth
 * showing the visitor.
 */
export function readEarlyAccessSignup(
  body: Record<string, unknown>,
): { signup: ValidEarlyAccessSignup } | { problem: string } {
  const emailProblem = describeEmailProblem(body.email);
  if (emailProblem) return { problem: emailProblem };

  const sourceProblem = describeFeedbackSourceProblem(body.feedbackSource);
  if (sourceProblem) return { problem: sourceProblem };

  return {
    signup: {
      emailAddress: normalizeEmailAddress(body.email as string),
      feedbackSourceId: body.feedbackSource as string,
    },
  };
}
