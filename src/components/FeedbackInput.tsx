"use client";

import { useState } from "react";
import { CsvUpload } from "./CsvUpload";

// Sample datasets with metadata — 30 items each for impressive 30→7 wow factor
const SAMPLE_DATASETS = [
  {
    id: "notion",
    product: "Notion",
    source: "Trustpilot + Product Hunt + GitHub Issues",
    date: "2025-2026",
    count: 30,
    items: [
      "Notion is really complicated and slow nowadays. It lost the charm now.",
      "i loved notion before, but sadly it has changed... it's often buggy and slow now, which make managing tasks frustrating",
      "It can be really useful when it works properly, but the problem is its often slow or goes down, which makes it frustrating to rely on.",
      "The pro upgrade is a scam. AI agent features require additional charges beyond the subscription costs you already pay.",
      "Predatory billing practices. I shared read-only content and it resulted in unexpected billable member charges I never authorized.",
      "I paid $288 for an annual Business plan and they refused to refund me after I barely used it. Rigid refund policy is unacceptable.",
      "they changed the api integration so that it's unpossible now",
      "worst software ever its always buggy",
      "the worst app cant even load first of all",
      "Way too expensive",
      "To close your account you need to provide your email that you sign into with, yet it doesn't recognise it at all. No customer support either.",
      "Great tool if someone explains how to use it and builds everything for you. Otherwise - waste of time. No support.",
      "Cannot change seats so they let you pay unnecessary much.",
      "Notion has given me the flexibility I was looking for in my projects. I have everything I need in one place.",
      "Notion has been a really good tool for the team communication, task management or collaborative projects.",
      "Notion's core problem is that it creates work disguised as productivity. A plain text file and Google Docs get more done in less time.",
      "Credit where it's due, the customisation options are extensive. You can build almost anything.",
      "There is no API endpoint to enable or configure subitems on a database programmatically. Teams automating project hierarchies are blocked.",
      "When retrieving data from datasource query, the type of item which has rich text or title property is incorrect.",
      "Callout blocks are defined under BlockObjectRequestWithoutChildren type, while in reality they do have children. This inaccuracy is also present in the docs.",
      "Notion is a slow app that sometimes takes forever to load. Since it operates primarily online, the application must download notes each time it opens.",
      "I cannot take a note offline when lacking WiFi or in areas with poor cellular reception. This is a dealbreaker for me.",
      "Just spent 45 mins trying to copy and paste something from one page to another lol started glitching out and being slow af.",
      "Pasting text from other places often messes up the formatting.",
      "The API's rate limit is 3 requests per second per integration. Some actions require multiple API calls which consumes your task limits quickly.",
      "Although offline mode shipped after years as the most requested feature, it comes with real limitations: sync conflicts can silently overwrite work.",
      "No built-in way to pop information up where you actually need it. Missing features like time tracking and native reporting/charts.",
      "AI features feel basic compared to competitors. Limited native form capabilities without conditional logic.",
      "Performance drops noticeably with databases over 5,000 records. Loading times increase from instant to 3-5 seconds per page.",
      "The mobile version is limited compared to desktop. I have difficulties editing pages and navigating the app on smaller screens.",
    ],
  },
  {
    id: "linear",
    product: "Linear",
    source: "Product Hunt + GitHub Issues + Trustpilot",
    date: "2025-2026",
    count: 30,
    items: [
      "Linear brags about 'god-tier design,' but they literally trap your data. I deleted my workspace and now I'm stuck in a permanent redirect loop.",
      "Definitely a great fit for small teams. We love the super clean/intuitive interface, awesome keyboard shortcuts. The one thing frustrating is how often bugs creep into new releases.",
      "Very poor customer relations and a waste of time. Why advertise a product when you don't reply to joining requests? No contact for 2 months now.",
      "3x better than Jira. So glad we found this tool. Never going back to Jira.",
      "No one on our team liked project management software until we found Linear.",
      "After years of Jira, we really loved the speed that Linear allowed us to reach!",
      "Linear is the only PM tool that doesn't feel like it's fighting you. We track everything across engineering in it.",
      "If you are a product based company, Linear is the most powerful fine-tuned platform. But if you are a software service company, it is hard to manage multiple client projects.",
      "Linear is missing documentation features like Jira Confluence. Hard to manage multiple projects being released simultaneously.",
      "Started using linear recently, really flexible software. Lack of sharing capabilities externally is quite a problem.",
      "The sidebar has many tabs together, making it annoying to navigate. They should try making the letters bigger.",
      "Linear fits well for small startup teams but gets messy when the roadmap grows just a little. There are no board or flight level views.",
      "The main criticism: it can feel opinionated and limiting for larger, client-facing, or multi-team workflows.",
      "MCP cannot be authenticated in claude code. It opens the browser, shows 'Login successful' but never comes back to the application.",
      "Error: setTeams cannot be combined with addTeams or removeTeams. I keep getting this error when the MCP tries to call linear_save_project.",
      "When syncing large numbers of issues from external tools, the only option is to call save_issue one at a time. For 78 issues, this means 78 sequential API calls.",
      "The MCP server exposes approximately 45 tools. Some agents warn when tools exceed 50. Please redesign the MCP tools around user tasks, not API endpoints.",
      "The 'Remind Me' feature exists only in the UI but there are no corresponding GraphQL mutations for programmatic access.",
      "CSV imports ignore dependencies, requiring manual linking afterward. Please support setting issue dependencies in linear-import.",
      "Your new Pull Request Reviews feature on GitHub is fire. We use a self-hosted GitLab instance and would love the same for GitLab merge requests.",
      "How can we keep the creator data from the CSV? After import, I get all issues created by the user that created the API key.",
      "Sometimes I want all issues under a project to have certain labels. Having to add the label to each issue is unnecessarily time consuming.",
      "Speed compared to Jira, keyboard support, dark mode, simplicity focus, integrations. The one thing missing is more analytics on the standard plan.",
      "Simplicity, stunning design, product integrations. It lacks a simple time tracking tool and there's no integration with the Tempo app.",
      "Github integration allows commit referencing which is great for team coordination. But there's dead space in the UI and the inbox functionality is unclear.",
      "Simple, straightforward UI, great tagging/labeling. The main gap: no mobile apps and it lacks documentation software like Confluence.",
      "Accessibility through keyboard shortcuts and Slack integration makes the entire work process much simpler. This is the only PM tool I actually want to open.",
      "Bugs creep into new releases frequently. We've had bugs that partially or fully disrupted the ability to use their web app three times in the last two months.",
      "We use Linear to manage the roadmap, dev and design tasks and support cases. The one real gap is there's no first-class release management view.",
      "Onboarding is smooth once you're in, but the curve for users migrating from other tools is real. Everything works differently enough from Jira.",
    ],
  },
  {
    id: "affine",
    product: "AFFiNE",
    source: "GitHub Issues",
    date: "2025-2026",
    count: 30,
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
      "Native table block column resize broken in edgeless mode. Dragging the column resize handle causes the entire canvas to pan.",
      "When writing in multi-select field the first letter creates new option instead of searching existing options.",
      "Arabic text with embedded English becomes unreadable in the app. The text alignment breaks.",
      "Arrows connecting two shapes are not duplicated when duplicating a page.",
      "Can't Connect to self hosted with Android App. Self hosted Affine Behind Traefik and netbird.",
      "Inherit tags from templates upon creation of document. I would like to add a tag like 'Meeting-Notes' to a template.",
      "Tag-based AI search for documents (MCP Server). I needed to search for documents marked with a specific tag but this feature doesn't exist.",
      "when i try to link google calendar, there's an error 'This app is blocked' by Google.",
      "Page Mode loading and editing lag scale with number of embedded frames. The more frames, the worse the lag.",
      "Documents created via MCP WebSocket API don't appear in workspace doc list despite being queryable via GraphQL.",
      "The drawing board connected arrow blocks the text. Arrows on the canvas overlap and cover text in notes.",
      "Hyperlinks are not clickable when textbox is locked on edgeless canvas.",
      "Basic editor bug: can't add image in quote.",
      "Keyboard shortcuts unable writing in Polish. Pressing Polish diacritic characters triggers shortcuts instead of typing.",
      "import markdown files did not download the images. If the markdown has embedded images from external URLs, they are not downloaded on import.",
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
