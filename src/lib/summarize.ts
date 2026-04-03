/**
 * Type-aware cluster summarizer — produces genuinely useful tickets.
 *
 * The output should read like something a PM would actually put in Jira/Linear.
 * Not AI-sounding. Not generic. Specific, actionable, clear.
 *
 * Three output types:
 * - Bug cluster → bug ticket a dev can start working on
 * - Feature cluster → feature ticket with clear user stories
 * - Feedback/mixed → strategic epic with concrete sub-stories
 */

import { callLLMStructured, MODELS, type LLMMessage } from "./llm";
import type { FeedbackItem } from "./types";
import type { TopicCluster } from "./cluster";

// ── JSON Schemas for structured output ──

const BUG_SCHEMA = {
  name: "bug_ticket",
  schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      summary: { type: "string" as const },
      severity: { type: "string" as const, enum: ["critical", "high", "medium", "low"] },
      acceptanceCriteria: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["title", "summary", "severity", "acceptanceCriteria"],
    additionalProperties: false,
  },
};

const FEATURE_SCHEMA = {
  name: "feature_ticket",
  schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      summary: { type: "string" as const },
      severity: { type: "string" as const, enum: ["critical", "high", "medium", "low"] },
      acceptanceCriteria: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["title", "summary", "severity", "acceptanceCriteria"],
    additionalProperties: false,
  },
};

const EPIC_SCHEMA = {
  name: "epic",
  schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      summary: { type: "string" as const },
      severity: { type: "string" as const, enum: ["critical", "high", "medium", "low"] },
      stories: { type: "array" as const, items: { type: "string" as const } },
      followUpQuestions: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["title", "summary", "severity", "stories", "followUpQuestions"],
    additionalProperties: false,
  },
};

// ── Output Types ──

export interface BugTicketSummary {
  kind: "bug_ticket";
  title: string;
  summary: string;
  type: "bug";
  severity: "critical" | "high" | "medium" | "low";
  acceptanceCriteria: string[];
  stories: string[];
  followUpQuestions: string[];
}

export interface FeatureTicketSummary {
  kind: "feature_ticket";
  title: string;
  summary: string;
  type: "feature";
  severity: "critical" | "high" | "medium" | "low";
  acceptanceCriteria: string[];
  stories: string[];
  followUpQuestions: string[];
}

export interface EpicSummary {
  kind: "epic";
  title: string;
  summary: string;
  type: "feedback";
  severity: "critical" | "high" | "medium" | "low";
  acceptanceCriteria: string[];
  stories: string[];
  followUpQuestions: string[];
}

export type ClusterSummary = BugTicketSummary | FeatureTicketSummary | EpicSummary;

// ── Determine cluster kind ──

function determineClusterKind(allItems: FeedbackItem[]): "bug_ticket" | "feature_ticket" | "epic" {
  let bugs = 0, features = 0, feedback = 0;
  for (const item of allItems) {
    if (item.classification.type === "bug") bugs++;
    else if (item.classification.type === "feature") features++;
    else feedback++;
  }

  // Majority rules, feedback defaults to epic
  if (bugs > features && bugs > feedback) return "bug_ticket";
  if (features > bugs && features > feedback) return "feature_ticket";
  return "epic";
}

// ── Prompts — designed for CLEAR, ACTIONABLE output ──

function buildBugPrompt(items: FeedbackItem[], topicLabel: string): LLMMessage[] {
  const list = items
    .map((item, i) => `${i + 1}. "${item.cleaned}"`)
    .join("\n");

  return [
    {
      role: "system",
      content: `You are a senior PM writing a bug ticket that a developer will read tomorrow morning. Write clearly and specifically — no filler, no AI-speak, no "users report that." Just say what's broken and what fixing it looks like.

The topic of these reports is: "${topicLabel}"

Write as if you're filing this in Linear or Jira. A developer should read the title and immediately know what to investigate. The summary should explain the impact in 2-3 sentences. Acceptance criteria should be testable pass/fail checks.

Respond ONLY with valid JSON:
{
  "title": "Specific bug title — what's broken (max 60 chars)",
  "summary": "2-3 sentences: what happens, when it happens, who it affects, how bad it is",
  "severity": "critical" | "high" | "medium" | "low",
  "acceptanceCriteria": ["Specific testable fix 1", "Fix 2", "Fix 3"]
}`,
    },
    {
      role: "user",
      content: `${items.length} bug reports about "${topicLabel}":\n\n${list}`,
    },
  ];
}

function buildFeaturePrompt(items: FeedbackItem[], topicLabel: string): LLMMessage[] {
  const list = items
    .map((item, i) => `${i + 1}. "${item.cleaned}"`)
    .join("\n");

  return [
    {
      role: "system",
      content: `You are a senior PM writing a feature ticket. Write it so a developer AND a designer both understand what to build and why. No fluff. Clear user value.

The topic of these requests is: "${topicLabel}"

The title should describe what users want (not a solution — the need). The summary should explain the pattern: who wants it, why they want it, and what they can't do today. Acceptance criteria should be "when this ships, these things are true."

Respond ONLY with valid JSON:
{
  "title": "What users need (max 60 chars)",
  "summary": "2-3 sentences: the user need, why it matters, what's missing today",
  "severity": "critical" | "high" | "medium" | "low",
  "acceptanceCriteria": ["User can do X", "Y works correctly", "Z is supported"]
}`,
    },
    {
      role: "user",
      content: `${items.length} feature requests about "${topicLabel}":\n\n${list}`,
    },
  ];
}

function buildEpicPrompt(items: FeedbackItem[], topicLabel: string): LLMMessage[] {
  const list = items
    .map((item, i) => {
      const c = item.classification;
      return `${i + 1}. [${c.type}] "${item.cleaned}"`;
    })
    .join("\n");

  return [
    {
      role: "system",
      content: `You are a VP of Product writing a strategic epic. This isn't a single bug or feature — it's a pattern of user sentiment that needs a coordinated response.

The topic of this feedback is: "${topicLabel}"

The title should name the initiative (what you're going to do about it). The summary should explain the pattern you're seeing across the feedback, why it's strategically important, and the outcome you want. Stories should be specific, shippable work items — each one a ticket a team could pick up in a sprint.

Also write 2-3 follow-up questions a PM should ask users who gave this feedback, to turn the general sentiment into specific actionable requirements. These must be SPECIFIC to this topic — reference the actual area of concern, not generic discovery questions.

Respond ONLY with valid JSON:
{
  "title": "Strategic initiative name (max 60 chars)",
  "summary": "2-3 sentences: the pattern, why it matters strategically, the desired outcome",
  "severity": "critical" | "high" | "medium" | "low",
  "stories": ["Specific shippable work item 1", "Work item 2", "Work item 3", "Work item 4"],
  "followUpQuestions": ["Specific question about this topic 1", "Question 2"]
}

Write 3-6 stories. Each should be concrete enough to estimate — not vague.`,
    },
    {
      role: "user",
      content: `${items.length} feedback items about "${topicLabel}":\n\n${list}`,
    },
  ];
}

// ── Validate ──

function validateSummary(data: unknown, kind: string): Record<string, unknown> {
  if (!data || typeof data !== "object") throw new Error("Summary is not an object");
  const obj = data as Record<string, unknown>;
  if (typeof obj.title !== "string" || obj.title.length === 0) throw new Error("Invalid title");
  if (typeof obj.summary !== "string" || obj.summary.length === 0) throw new Error("Invalid summary");
  if (!["critical", "high", "medium", "low"].includes(obj.severity as string)) throw new Error(`Invalid severity: ${obj.severity}`);

  if (kind === "epic") {
    if (!Array.isArray(obj.stories) || obj.stories.length === 0) throw new Error("Invalid stories");
  } else {
    if (!Array.isArray(obj.acceptanceCriteria) || obj.acceptanceCriteria.length === 0) throw new Error("Invalid acceptanceCriteria");
  }
  return obj;
}

// ── Main ──

const MAX_ITEMS_FOR_SUMMARIZE = 10; // cap items sent to LLM to prevent timeouts
const SUMMARIZE_TIMEOUT_MS = 15_000; // 15s per cluster max

export async function summarizeCluster(cluster: TopicCluster): Promise<ClusterSummary> {
  const allItems: FeedbackItem[] = [];
  for (const group of cluster.items) {
    allItems.push(group.primary);
    allItems.push(...group.merged);
  }

  // Cap items to prevent oversized prompts that cause timeouts
  // Keep the most diverse items (primaries first, then merged)
  const itemsForPrompt = allItems.length > MAX_ITEMS_FOR_SUMMARIZE
    ? allItems.slice(0, MAX_ITEMS_FOR_SUMMARIZE)
    : allItems;

  const kind = determineClusterKind(allItems); // use ALL items for kind detection

  const topicLabel = cluster.label;

  let messages: LLMMessage[];
  let schema: { name: string; schema: Record<string, unknown> };

  if (kind === "bug_ticket") {
    messages = buildBugPrompt(itemsForPrompt, topicLabel);
    schema = BUG_SCHEMA;
  } else if (kind === "feature_ticket") {
    messages = buildFeaturePrompt(itemsForPrompt, topicLabel);
    schema = FEATURE_SCHEMA;
  } else {
    messages = buildEpicPrompt(itemsForPrompt, topicLabel);
    schema = EPIC_SCHEMA;
  }

  // Per-cluster timeout to prevent one slow call from blocking the pipeline
  const llmPromise = callLLMStructured<Record<string, unknown>>(MODELS.NANO, messages, schema);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Summarize timeout")), SUMMARIZE_TIMEOUT_MS),
  );

  const v = await Promise.race([llmPromise, timeoutPromise]);

  return {
    kind,
    title: ((v.title as string) || topicLabel).slice(0, 80),
    summary: (v.summary as string) || `Feedback about "${topicLabel}".`,
    type: kind === "bug_ticket" ? "bug" : kind === "feature_ticket" ? "feature" : "feedback",
    severity: (v.severity as "critical" | "high" | "medium" | "low") || "medium",
    acceptanceCriteria: kind !== "epic" ? ((v.acceptanceCriteria as string[]) || []).slice(0, 5) : [],
    stories: kind === "epic" ? ((v.stories as string[]) || []).slice(0, 6) : [],
    followUpQuestions: ((v.followUpQuestions as string[]) || []).slice(0, 3),
  } as ClusterSummary;
}

export async function summarizeClusters(
  clusters: TopicCluster[],
  onProgress?: (completed: number, total: number) => void,
): Promise<ClusterSummary[]> {
  let completed = 0;
  const results = await Promise.all(
    clusters.map(async (cluster) => {
      try {
        const result = await summarizeCluster(cluster);
        completed++;
        onProgress?.(completed, clusters.length);
        return result;
      } catch (err) {
        console.log(`[summarize] ⚠ Failed to summarize "${cluster.label}", using fallback: ${err}`);
        completed++;
        onProgress?.(completed, clusters.length);

        // Fallback: construct a basic summary from the cluster label + items
        const allItems: FeedbackItem[] = [];
        for (const g of cluster.items) { allItems.push(g.primary); allItems.push(...g.merged); }
        const kind = determineClusterKind(allItems);
        const topSeverity = allItems.reduce((best, item) => {
          const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          return (order[item.classification.severity] ?? 3) < (order[best] ?? 3) ? item.classification.severity : best;
        }, "low" as string);

        return {
          kind,
          title: cluster.label,
          summary: `${allItems.length} feedback items about "${cluster.label}".`,
          type: kind === "bug_ticket" ? "bug" : kind === "feature_ticket" ? "feature" : "feedback",
          severity: topSeverity as "critical" | "high" | "medium" | "low",
          acceptanceCriteria: kind !== "epic" ? [`Resolve issues related to ${cluster.label}`] : [],
          stories: kind === "epic" ? [`Investigate and address ${cluster.label} feedback`] : [],
        } as ClusterSummary;
      }
    }),
  );
  return results;
}
