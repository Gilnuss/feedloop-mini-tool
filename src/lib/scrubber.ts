/**
 * PII Scrubber — regex-based, zero deps, runs locally in <1ms.
 * Best-effort: catches common PII patterns but is not exhaustive.
 * Adapted from FeedLoop packages/shared/src/privacy/scrubber.ts
 */

export interface Redaction {
  type: "EMAIL" | "PHONE" | "SSN" | "DOB" | "TOKEN" | "NAME" | "CREDIT_CARD" | "IP_ADDRESS" | "USERNAME";
  original: string;
}

export interface ScrubResult {
  cleaned: string;
  redactions: Redaction[];
}

const PII_PATTERNS: Array<{ type: Redaction["type"]; re: RegExp }> = [
  { type: "EMAIL", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
  { type: "PHONE", re: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { type: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "DOB", re: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g },
  { type: "TOKEN", re: /\b(?:sk|pk|acct|key|token|secret|api)[_-][A-Za-z0-9_-]{8,}\b/gi },
  { type: "CREDIT_CARD", re: /\b(?:\d[ -]*?){13,19}\b/g },
  { type: "IP_ADDRESS", re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { type: "USERNAME", re: /(?<!\w)@[A-Za-z0-9_]{2,30}\b/g },
  { type: "NAME", re: /\bMy name is ([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g },
];

export function scrubPII(text: string): ScrubResult {
  let cleaned = text;
  const redactions: Redaction[] = [];

  for (const pattern of PII_PATTERNS) {
    const matches = cleaned.match(pattern.re) || [];
    for (const match of matches) {
      const original =
        pattern.type === "NAME" ? match.replace("My name is ", "") : match;
      redactions.push({ type: pattern.type, original });
      cleaned = cleaned.replace(match, `[REDACTED_${pattern.type}]`);
    }
  }

  return { cleaned, redactions };
}
