/**
 * Submit state for the early-access form.
 *
 * Split out of the form component so the component stays presentational and the
 * network behaviour is readable on its own. The funnel event fires from here,
 * on success only — an email_submitted recorded before the server confirmed the
 * write would overstate the one number this page exists to move.
 */

"use client";

import { useState, useCallback } from "react";
import { track } from "@/lib/track";

export type EarlyAccessSubmissionStatus = "idle" | "submitting" | "submitted" | "failed";

export function useEarlyAccessSubmission() {
  const [status, setStatus] = useState<EarlyAccessSubmissionStatus>("idle");
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  const submitEarlyAccessSignup = useCallback(
    async (emailAddress: string, feedbackSourceId: string) => {
      setStatus("submitting");
      setFailureMessage(null);

      try {
        const response = await fetch("/api/early-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailAddress, feedbackSource: feedbackSourceId }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          setFailureMessage(body.error || "Something went wrong. Please try again.");
          setStatus("failed");
          return;
        }

        // Backfill viewed_cached_results for the same reason the trial CTA does:
        // a visitor who read this page slowly enough to rotate their session is
        // still someone who saw results, and counting them otherwise turns a
        // considered conversion into a false orphan.
        track("email_submitted", { newSessionBackfill: ["viewed_cached_results"] });
        setStatus("submitted");
      } catch {
        setFailureMessage("Could not reach the server. Please try again.");
        setStatus("failed");
      }
    },
    [],
  );

  return { status, failureMessage, submitEarlyAccessSignup };
}
