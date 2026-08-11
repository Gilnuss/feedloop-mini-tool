/**
 * Reads the numbers from the visitor's most recent decode, so /full can open by
 * referring to what they just watched happen instead of pitching from zero.
 *
 * Returns null when there is nothing cached — someone can reach /full from a
 * shared link without ever having run anything, and that path must render a
 * sensible page rather than a sentence with holes in it.
 *
 * ⚠️ STORAGE_KEY is duplicated from hooks/useDecoder.ts rather than imported.
 * If you rename it there, rename it here too — nothing will fail loudly, the
 * hero will just quietly stop personalising. This is the one place in this
 * feature where standing alone costs something, and it is deliberate.
 */

"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "feedloop-decode-last-result";

export interface LastDecodeSummary {
  inputCount: number;
  issueCount: number;
  duplicateCount: number;
}

function readLastDecodeSummaryFromStorage(): LastDecodeSummary | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const stats = parsed?.stats;

    // A partially-written or older-shaped record must not render "undefined
    // items into undefined tickets" — treat anything unexpected as absent.
    if (
      typeof stats?.inputCount !== "number" ||
      typeof stats?.issueCount !== "number"
    ) {
      return null;
    }

    return {
      inputCount: stats.inputCount,
      issueCount: stats.issueCount,
      duplicateCount: typeof stats.duplicateCount === "number" ? stats.duplicateCount : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Null on the first render even when a result exists — localStorage cannot be
 * read during SSR, so the personalised copy has to arrive after hydration or
 * React will report a mismatch.
 */
export function useLastDecodeSummary(): LastDecodeSummary | null {
  const [summary, setSummary] = useState<LastDecodeSummary | null>(null);

  useEffect(() => {
    setSummary(readLastDecodeSummaryFromStorage());
  }, []);

  return summary;
}
