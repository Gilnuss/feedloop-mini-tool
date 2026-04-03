"use client";

import { useState } from "react";
import { CsvUpload } from "./CsvUpload";

// Sample datasets with metadata
const SAMPLE_DATASETS = [
  {
    id: "notion",
    product: "Notion",
    source: "Product Hunt + GitHub Issues",
    date: "2025-2026",
    count: 15,
    items: [
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
    ],
  },
  {
    id: "linear",
    product: "Linear",
    source: "Product Hunt + GitHub Issues + Trustpilot",
    date: "2025-2026",
    count: 15,
    items: [
      "Linear brags about 'god-tier design,' but they literally trap your data. I deleted my workspace and now I'm stuck in a permanent redirect loop.",
      "Definitely a great fit for small teams. We love the super clean/intuitive interface, awesome keyboard shortcuts. The one thing frustrating is how often bugs creep into new releases.",
      "3x better than Jira. So glad we found this tool. Never going back to Jira.",
      "No one on our team liked project management software until we found Linear.",
      "Linear is missing documentation features like Jira Confluence. Hard to manage multiple projects being released simultaneously.",
      "Started using linear recently, really flexible software. Lack of sharing capabilities externally is quite a problem.",
      "The sidebar has many tabs together, making it annoying to navigate. They should try making the letters bigger.",
      "Linear fits well for small startup teams but gets messy when the roadmap grows just a little. There are no board or flight level views.",
      "MCP cannot be authenticated in claude code. It opens the browser, shows 'Login successful' but never comes back to the application.",
      "When syncing large numbers of issues from external tools, the only option is to call save_issue one at a time. For 78 issues, this means 78 sequential API calls.",
      "The MCP server exposes approximately 45 tools. Some agents warn when tools exceed 50. Please redesign the MCP tools around user tasks, not API endpoints.",
      "CSV imports ignore dependencies, requiring manual linking afterward.",
      "Your new Pull Request Reviews feature on GitHub is fire. We use a self-hosted GitLab instance and would love the same for GitLab merge requests.",
      "Speed compared to Jira, keyboard support, dark mode, simplicity focus, integrations. The one thing missing is more analytics on the standard plan.",
      "Accessibility through keyboard shortcuts and Slack integration makes the entire work process much simpler. This is the only PM tool I actually want to open.",
    ],
  },
  {
    id: "affine",
    product: "AFFiNE",
    source: "GitHub Issues",
    date: "2025-2026",
    count: 15,
    items: [
      "CAN'T PAY FOR LIFETIME PLAN. BRO I CAN'T PAY / SUBSCRIBE TO PAID LIFETIME MEMBERSHIP NEITHER THROUGH THE APP NEITHER THROUGH THE WEB VERSION MAN!",
      "Cant Sign-In to my Affine Cloud Account. I am trying to sign in via Google Auth but it is not working and I get error 400.",
      "AFFiNE Cloud attachments fail to upload/open, GraphQL returns 502 Bad Gateway.",
      "mac platform option+command+c can't make text to code block. Nothing happens.",
      "Shared Edgeless/Board pages render login page for unauthenticated visitors instead of the board content.",
      "please add export to pdf and word",
      "Pressing enter when editing column header name doesn't save the edits. The edit overlay closes without saving.",
      "Sidebar constantly reordering while typing. While typing in a document the documents in the sidebar keep moving.",
      "Kanban board is broken. After the last update all cards disappeared and the board shows empty.",
      "can't login in selfhosted Affine instance even after running the affine_migration_job with success.",
      "Search is broken in desktop apps for non-latin and non-CJK words. Affected languages are Russian, Ukrainian.",
      "Docker image runs as root. This is a security concern for self-hosted deployments.",
      "After selecting text to add a hyperlink, directly typing Chinese characters causes the program to freeze.",
      "would you kindly add a zoom in/out function, just like onenote or other office software.",
      "I find this software incredibly satisfying to use. It's exactly the kind of tool I've always dreamed of.",
    ],
  },
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
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const [loadedSample, setLoadedSample] = useState<string | null>(null);

  const handleCsvItems = (items: string[]) => {
    setLoadedSample(null);
    setInputText(items.join("\n"));
  };

  const handleSamplePick = (dataset: (typeof SAMPLE_DATASETS)[0]) => {
    setLoadedSample(dataset.id);
    onLoadSample(dataset.items);
    setShowSamplePicker(false);
  };

  const loadedDataset = SAMPLE_DATASETS.find((d) => d.id === loadedSample);

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
        {/* Sample data source label */}
        {loadedDataset && (
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <span className="text-xs text-purple-400">
              📦 Sample: <strong>{loadedDataset.product}</strong> reviews from {loadedDataset.source} ({loadedDataset.date})
            </span>
            <button
              onClick={() => { setLoadedSample(null); setInputText(""); }}
              className="ml-auto text-xs text-zinc-500 hover:text-zinc-300"
            >
              ✕ Clear
            </button>
          </div>
        )}

        <textarea
          className="w-full h-48 bg-[#1A1A1A] border border-[#27272A] rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
          placeholder={"Paste your feedback here, one per line...\n\n\"login is broken on mobile\"\n\"sidebar has too many tabs\"\n\"please add dark mode\""}
          value={inputText}
          onChange={(e) => { setInputText(e.target.value); setLoadedSample(null); }}
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
      <div className="flex items-center gap-3 w-full relative">
        <CsvUpload onItemsSelected={handleCsvItems} />

        <div className="relative">
          <button
            onClick={() => setShowSamplePicker(!showSamplePicker)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#27272A] rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Try sample data
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Sample picker dropdown */}
          {showSamplePicker && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-[#141414] border border-[#27272A] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-[#27272A]">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                  Real product reviews
                </p>
              </div>
              {SAMPLE_DATASETS.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => handleSamplePick(ds)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#1A1A1A] transition-colors border-b border-[#27272A] last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {ds.product}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-600">
                      {ds.count} items
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {ds.source} · {ds.date}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

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
