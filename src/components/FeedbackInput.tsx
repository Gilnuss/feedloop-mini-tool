"use client";

import { useState } from "react";
import { CsvUpload } from "./CsvUpload";
import { SAMPLE_DATASETS } from "@/content/demo/sampleDatasets";
import type { SampleDataset } from "@/content/demo/sampleDatasets";

interface Props {
  inputText: string;
  setInputText: (text: string) => void;
  itemCount: number;
  canDecode: boolean;
  onDecode: () => void;
  onLoadSample: (items: string[]) => void;
}

/**
 * Card header shown once a sample is loaded — names the product and where the
 * reviews came from. The provenance is what makes the demo credible; without it
 * a visitor can reasonably assume the input was written to suit the clustering.
 */
function LoadedSampleBanner({
  dataset,
  onClear,
}: {
  dataset: SampleDataset;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 border-b border-line-subtle bg-raised">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-signal-bg border border-signal-border text-signal-text text-xs font-semibold">
        Sample: {dataset.product} reviews
      </span>
      <span className="text-xs text-ink-dim">
        {dataset.source} · {dataset.date}
      </span>
      <button
        onClick={onClear}
        className="ml-auto text-xs text-ink-muted hover:text-ink-dim transition-colors"
      >
        Clear
      </button>
    </div>
  );
}

function SamplePicker({
  onPick,
  onDismiss,
  loadedSampleId,
}: {
  onPick: (dataset: SampleDataset) => void;
  onDismiss: () => void;
  loadedSampleId: string | null;
}) {
  return (
    <>
      {/* Backdrop (mobile) */}
      <div className="fixed inset-0 bg-ink/20 z-40 sm:hidden" onClick={onDismiss} />

      {/* Opens UPWARD on desktop (sm:bottom-full). The trigger already sits near
          the bottom of the viewport, so dropping the list down pushed it under
          the fold and forced a scroll just to read three options. On mobile it
          stays a bottom sheet, which has the same effect for the same reason. */}
      <div className="fixed bottom-0 left-0 right-0 sm:absolute sm:top-auto sm:bottom-full sm:left-0 sm:right-auto sm:mb-1.5 w-full sm:w-72 bg-surface border-t sm:border border-line rounded-t-card sm:rounded-card shadow-pop z-50 overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line-subtle">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Real product reviews
          </span>
          <button onClick={onDismiss} className="text-ink-muted text-sm sm:hidden">
            ✕
          </button>
        </div>

        {SAMPLE_DATASETS.map((dataset) => (
          <button
            key={dataset.id}
            onClick={() => onPick(dataset)}
            className={`w-full flex flex-col gap-0.5 text-left px-3.5 py-2.5 border-b border-line-subtle last:border-b-0 transition-colors ${
              dataset.id === loadedSampleId
                ? "bg-signal-bg"
                : "bg-surface hover:bg-raised"
            }`}
          >
            <span className="flex items-center">
              <span className="text-[13px] font-semibold text-ink">
                {dataset.product}
              </span>
              <span className="ml-auto font-mono text-[11px] text-ink-muted">
                {dataset.count} items
              </span>
            </span>
            <span className="text-[11px] text-ink-dim">
              {dataset.source} · {dataset.date}
            </span>
          </button>
        ))}

        {/* Safe-area padding for iPhone */}
        <div className="h-5 sm:hidden" />
      </div>
    </>
  );
}

export function FeedbackInput({
  inputText,
  setInputText,
  itemCount,
  canDecode,
  onDecode,
  onLoadSample,
}: Props) {
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const [loadedSample, setLoadedSample] = useState<string | null>(null);

  const handleCsvItems = (items: string[]) => {
    setLoadedSample(null);
    setInputText(items.join("\n"));
  };

  const handleSamplePick = (dataset: SampleDataset) => {
    setLoadedSample(dataset.id);
    onLoadSample(dataset.items);
    setShowSamplePicker(false);
  };

  const loadedDataset = SAMPLE_DATASETS.find((d) => d.id === loadedSample);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[640px]">
      {/* The forced break is desktop-only. On a phone it costs a whole extra
          line for no gain — the sentence already wraps there. */}
      <h1 className="text-[26px] sm:text-[34px] font-bold text-ink text-center leading-[1.15] tracking-[-0.02em] text-balance">
        Paste your messy feedback.
        <br className="hidden sm:inline" />{" "}
        See what your users are actually saying.
      </h1>

      {/* Input card — header (provenance), textarea, footer (counts) */}
      <div className="w-full bg-surface border border-line rounded-card shadow-card overflow-hidden mt-1">
        {loadedDataset && (
          <LoadedSampleBanner
            dataset={loadedDataset}
            onClear={() => {
              setLoadedSample(null);
              setInputText("");
            }}
          />
        )}

        <textarea
          spellCheck={false}
          // Shorter on mobile so the Decode button stays above the fold; still
          // ~7 lines, which is enough to see that a paste landed.
          className="block w-full h-40 sm:h-52 border-none outline-none resize-none px-4 py-3.5 text-[13.5px] leading-relaxed text-ink placeholder-ink-muted bg-surface"
          placeholder={"Paste your feedback here, one per line...\n\n\"login is broken on mobile\"\n\"sidebar has too many tabs\"\n\"please add dark mode\""}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setLoadedSample(null);
          }}
        />

        <div className="flex items-center gap-3 px-3.5 py-2.5 border-t border-line-subtle bg-surface">
          <span className="font-mono text-xs text-ink-dim">
            {itemCount > 0 ? `${itemCount} items detected` : "No items yet"}
          </span>
          <span className="ml-auto font-mono text-xs text-ink-muted">
            min 10 · max 100
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5 w-full">
        <CsvUpload onItemsSelected={handleCsvItems} />

        <div className="relative">
          <button
            onClick={() => setShowSamplePicker(!showSamplePicker)}
            className="flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-control text-[13px] font-semibold text-ink-dim hover:text-ink hover:bg-raised transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Try sample data
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSamplePicker && (
            <SamplePicker
              onPick={handleSamplePick}
              onDismiss={() => setShowSamplePicker(false)}
              loadedSampleId={loadedSample}
            />
          )}
        </div>

        <button
          onClick={onDecode}
          disabled={!canDecode}
          className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-4.5 py-2.5 bg-signal rounded-control text-[13px] font-semibold text-signal-on shadow-card hover:bg-signal-hover disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
        >
          Decode my feedback →
        </button>
      </div>

      <p className="text-xs text-ink-muted text-center mt-1.5">
        No signup required · Your data is never stored · Powered by FeedLoop
      </p>
    </div>
  );
}
