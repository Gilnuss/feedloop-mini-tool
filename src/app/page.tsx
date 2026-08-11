"use client";

import { useDecoder } from "@/hooks/useDecoder";
import { FeedbackInput } from "@/components/FeedbackInput";
import { ProcessingView } from "@/components/ProcessingView";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { ProductMissionIntro } from "@/components/demo/ProductMissionIntro";
import { DecodeTopbar } from "@/components/demo/DecodeTopbar";

export default function Home() {
  const {
    state,
    inputText,
    setInputText,
    itemCount,
    canDecode,
    decode,
    reset,
    runAgain,
    loadSampleData,
    initialized,
  } = useDecoder();

  // Don't render until we've checked localStorage for cached results
  if (!initialized) {
    return (
      <main className="min-h-screen bg-canvas flex items-center justify-center">
        <span className="text-ink-muted text-sm">Loading...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      <DecodeTopbar
        right={
          state.phase === "processing" ? (
            <span className="font-mono text-xs text-ink-dim">
              {itemCount > 0 ? `${itemCount} items` : "working"}
            </span>
          ) : undefined
        }
      />

      {/* Content */}
      {/* Tighter vertical rhythm on mobile than desktop. Measured at 390×844:
          the primary CTA's bottom edge lands at ~580px, which clears the fold on
          a phone with browser chrome. Re-measure before adding anything above
          the input — a Decode button you have to scroll for is the one leak this
          screen cannot afford. */}
      <div className="flex-1 flex justify-center px-4 sm:px-8 py-6 sm:py-12">
        {state.phase === "input" && (
          <div className="flex flex-col items-center gap-5 sm:gap-7 w-full">
            <ProductMissionIntro />
            <FeedbackInput
              inputText={inputText}
              setInputText={setInputText}
              itemCount={itemCount}
              canDecode={canDecode}
              onDecode={() => decode()}
              onLoadSample={loadSampleData}
            />
          </div>
        )}

        {state.phase === "processing" && (
          <div className="flex items-start justify-center w-full">
            <ProcessingView
              stage={state.stage}
              progress={state.progress}
              detail={state.detail}
            />
          </div>
        )}

        {state.phase === "results" && (
          <ResultsDashboard
            result={state.data}
            onReset={reset}
            onRunAgain={runAgain}
          />
        )}

        {state.phase === "error" && (
          <div className="flex items-center">
            <div className="flex flex-col items-center gap-4 max-w-md">
              <span className="flex items-center justify-center w-11 h-11 rounded-full bg-sev-critical-bg">
                <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              <h2 className="text-lg font-semibold text-ink">Something went wrong</h2>
              <p className="text-sm text-ink-dim text-center">{state.message}</p>
              <button
                onClick={reset}
                className="px-5 py-2.5 bg-signal rounded-control text-sm font-semibold text-white hover:bg-signal-hover transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
