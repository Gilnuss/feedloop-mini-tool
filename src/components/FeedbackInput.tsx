"use client";

import { CsvUpload } from "./CsvUpload";

// Sample data — first 15 items from our Notion test set
const SAMPLE_ITEMS = [
  "Notion is really complicated and slow nowadays. It lost the charm now.",
  "i loved notion before, but sadly it has changed... it's often buggy and slow now",
  "It can be really useful when it works properly, but the problem is its often slow or goes down",
  "The pro upgrade is a scam. AI agent features require additional charges beyond the subscription",
  "Predatory billing practices. I shared read-only content and it resulted in unexpected charges",
  "they changed the api integration so that it's unpossible now",
  "worst software ever its always buggy",
  "the worst app cant even load first of all",
  "Great tool if someone explains how to use it. Otherwise - waste of time. No support.",
  "Notion has given me the flexibility I was looking for in my projects.",
  "Notion has been a really good tool for the team communication and task management.",
  "I cannot take a note offline when lacking WiFi. This is a dealbreaker for me.",
  "Performance drops noticeably with databases over 5,000 records.",
  "The mobile version is limited compared to desktop. I have difficulties editing pages.",
  "Pasting text from other places often messes up the formatting.",
];

interface Props {
  inputText: string;
  setInputText: (text: string) => void;
  itemCount: number;
  canDecode: boolean;
  onDecode: () => void;
  onLoadSample: (items: string[]) => void;
}

export function FeedbackInput({
  inputText,
  setInputText,
  itemCount,
  canDecode,
  onDecode,
  onLoadSample,
}: Props) {
  const handleCsvItems = (items: string[]) => {
    setInputText(items.join("\n"));
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[640px]">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4">
        <span className="px-4 py-1.5 rounded-full bg-[#1A1A1A] text-xs text-zinc-500">
          Based on SIGIR 2025 research
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center leading-tight">
          Paste your messy feedback.
          <br />
          See what your users are actually saying.
        </h1>
        <p className="text-base text-zinc-400 text-center max-w-[520px]">
          AI-powered clustering turns 50 raw complaints into 7 actionable
          tickets in 12 seconds.
        </p>
      </div>

      {/* Textarea */}
      <div className="w-full flex flex-col gap-3">
        <textarea
          className="w-full h-48 bg-[#1A1A1A] border border-[#27272A] rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
          placeholder={"Paste your feedback here, one per line...\n\n\"login is broken on mobile\"\n\"sidebar has too many tabs\"\n\"please add dark mode\""}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        {/* Counter */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-mono text-zinc-500">
            {itemCount > 0 ? `${itemCount} items detected` : "No items yet"}
          </span>
          <span className="text-xs text-zinc-600">Min 10 · Max 100</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 w-full">
        <CsvUpload onItemsSelected={handleCsvItems} />

        <button
          onClick={() => onLoadSample(SAMPLE_ITEMS)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#27272A] rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Try with sample data
        </button>

        <button
          onClick={onDecode}
          disabled={!canDecode}
          className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-purple-600 rounded-lg text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Decode my feedback →
        </button>
      </div>

      {/* Footer */}
      <p className="text-xs text-zinc-600 text-center">
        No signup required · Your data is never stored · Powered by FeedLoop
      </p>
    </div>
  );
}
