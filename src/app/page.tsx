"use client";

import { useDecoder } from "@/hooks/useDecoder";
import { FeedbackInput } from "@/components/FeedbackInput";
import { ProcessingView } from "@/components/ProcessingView";
import { ResultsDashboard } from "@/components/ResultsDashboard";

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
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <span className="text-zinc-600 text-sm">Loading...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1A1A1A]">
        <span className="text-base sm:text-lg font-semibold text-white">
          ⚡ FeedLoop Decode
        </span>
        <a
          href="https://feedloop.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          feedloop.dev →
        </a>
      </nav>

      {/* Content */}
      <div className="flex-1 flex justify-center px-4 sm:px-6 py-8 sm:py-12">
        {state.phase === "input" && (
          <div className="flex items-center">
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
          <div className="flex items-center">
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
              <div className="text-4xl">⚠️</div>
              <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
              <p className="text-sm text-zinc-400 text-center">{state.message}</p>
              <button
                onClick={reset}
                className="px-6 py-2.5 bg-purple-600 rounded-lg text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
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
