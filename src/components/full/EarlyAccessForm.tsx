/**
 * The terminal step of the funnel — a conversation rather than a signup.
 *
 * FeedLoop is priced per client, so there is nothing to self-serve into: the
 * outcome this page is built to produce is a call. That makes the form's job
 * slightly different from a waitlist — it has to collect enough to prepare for
 * that call without turning into a qualification questionnaire.
 *
 * Still two fields. Adding company size or job title costs up to a third of
 * conversions, and both are things you can simply ask on the call. The one
 * question kept is the one whose answers, in aggregate, decide what gets built
 * next — it earns its place by informing the roadmap, not the sales call.
 *
 * ⚠️ Do not add a card field or a price. Neither exists at this stage.
 */

"use client";

import { useState } from "react";
import { FEEDBACK_SOURCE_OPTIONS } from "@/content/full/feedbackSourceOptions";
import { useEarlyAccessSubmission } from "@/hooks/useEarlyAccessSubmission";

function SubmittedConfirmation() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-signal-subtle">
        <svg className="w-5 h-5 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <h3 className="text-lg font-semibold text-ink">We will be in touch</h3>
      <p className="text-sm text-ink-dim max-w-[440px] leading-relaxed">
        Expect a short email within a couple of days, with a time to talk and a
        few questions about your setup. Send us an export in the meantime and we
        will run it through the full pipeline by hand before we speak.
      </p>
    </div>
  );
}

const FIELD_CLASSES =
  "w-full bg-surface border border-line rounded-control px-3 py-2.5 text-[13.5px] text-ink placeholder-ink-muted focus:outline-none focus:border-signal focus:ring-2 focus:ring-signal/15 transition-colors";

export function EarlyAccessForm() {
  const [emailAddress, setEmailAddress] = useState("");
  const [feedbackSourceId, setFeedbackSourceId] = useState("");
  const { status, failureMessage, submitEarlyAccessSignup } = useEarlyAccessSubmission();

  const canSubmit =
    emailAddress.trim().length > 0 && feedbackSourceId.length > 0 && status !== "submitting";

  return (
    <section
      id="talk-to-us"
      className="w-full bg-surface border border-line rounded-card shadow-card px-5 py-7 sm:px-6 sm:py-8 scroll-mt-20"
    >
      {status === "submitted" ? (
        <SubmittedConfirmation />
      ) : (
        <form
          className="flex flex-col gap-4.5 max-w-[420px] mx-auto"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) submitEarlyAccessSignup(emailAddress, feedbackSourceId);
          }}
        >
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h2 className="text-2xl font-bold text-ink tracking-[-0.02em]">
              Let&apos;s talk
            </h2>
            <p className="text-sm text-ink-dim">
              Two questions now, a real quote after we have seen your setup.
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-dim">Work email</span>
            <input
              type="email"
              required
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="you@company.com"
              className={FIELD_CLASSES}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-dim">
              Where does your feedback live today?
            </span>
            <select
              required
              value={feedbackSourceId}
              onChange={(event) => setFeedbackSourceId(event.target.value)}
              className={FIELD_CLASSES}
            >
              <option value="" disabled>
                Pick one
              </option>
              {FEEDBACK_SOURCE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-5 py-2.5 bg-signal rounded-control text-[13px] font-semibold text-white shadow-card hover:bg-signal-hover disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
          >
            {status === "submitting" ? "Sending..." : "Request a quote →"}
          </button>

          {status === "failed" && failureMessage && (
            <p className="text-[13px] text-danger text-center">{failureMessage}</p>
          )}

          <p className="text-xs text-ink-muted text-center leading-relaxed">
            No sales sequence. We store your email and that one answer — never the
            feedback you pasted.
          </p>
        </form>
      )}
    </section>
  );
}
