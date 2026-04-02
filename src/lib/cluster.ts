/**
 * LLM-powered clustering with dedup + topic grouping in the same call.
 *
 * Pass 1: LLM grouping + dedup (constrain to max 7 → review & split)
 *   - The LLM groups items by topic AND flags duplicates within each group
 *   - No embedding-based dedup (doesn't work on long multi-topic text)
 * Pass 2: Embedding coherence validation (sanity check)
 *
 * Embeddings are still generated for: coherence scoring, future use, analytics.
 *
 * Based on: "Text Clustering as Classification with LLMs" (SIGIR-AP 2025)
 */

import { callLLMStructured, MODELS, type LLMMessage } from "./llm";
import type { FeedbackItem } from "./types";

// ── Schema: grouping with dedup ──

const GROUPING_SCHEMA = {
  name: "feedback_grouping",
  schema: {
    type: "object" as const,
    properties: {
      groups: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            label: { type: "string" as const },
            itemIds: { type: "array" as const, items: { type: "number" as const } },
            duplicates: {
              type: "array" as const,
              items: {
                type: "object" as const,
                properties: {
                  kept: { type: "number" as const },
                  removed: { type: "array" as const, items: { type: "number" as const } },
                },
                required: ["kept", "removed"],
                additionalProperties: false,
              },
            },
          },
          required: ["label", "itemIds", "duplicates"],
          additionalProperties: false,
        },
      },
    },
    required: ["groups"],
    additionalProperties: false,
  },
};

// ── Vector Math ──

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function computeCentroid(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  const dims = embeddings[0].length;
  const centroid = new Array(dims).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dims; i++) centroid[i] += emb[i];
  }
  for (let i = 0; i < dims; i++) centroid[i] /= embeddings.length;
  return centroid;
}

// ── Types ──

export interface DedupGroup {
  primary: FeedbackItem;
  merged: FeedbackItem[];
  count: number;
}

export interface TopicCluster {
  label: string;
  items: DedupGroup[];
  centroid: number[];
  totalReportCount: number;
  uniqueCount: number;
  coherenceScore: number;
}

interface GroupingResult {
  groups: Array<{
    label: string;
    itemIds: number[];
    duplicates: Array<{ kept: number; removed: number[] }>;
  }>;
}

// ── Helper ──

function buildItemList(items: FeedbackItem[]): string {
  return items
    .map((item, i) => {
      const c = item.classification;
      const text = item.cleaned.length > 150
        ? item.cleaned.slice(0, 150) + "..."
        : item.cleaned;
      return `${i}. [${c.type}/${c.severity}/${c.productArea}] "${text}"`;
    })
    .join("\n");
}

function buildGroupSummary(result: GroupingResult): string {
  return result.groups
    .map((g, i) => {
      const dupeInfo = g.duplicates.length > 0
        ? ` (${g.duplicates.reduce((n, d) => n + d.removed.length, 0)} dupes merged)`
        : "";
      return `Group ${i + 1}: "${g.label}" — items [${g.itemIds.join(", ")}]${dupeInfo}`;
    })
    .join("\n");
}

function ensureAllAssigned(result: GroupingResult, totalItems: number): GroupingResult {
  const assigned = new Set<number>();
  const removed = new Set<number>();

  for (const g of result.groups) {
    for (const id of g.itemIds) if (id >= 0 && id < totalItems) assigned.add(id);
    for (const d of g.duplicates) {
      for (const r of d.removed) removed.add(r);
    }
  }

  const unassigned: number[] = [];
  for (let i = 0; i < totalItems; i++) {
    if (!assigned.has(i) && !removed.has(i)) unassigned.push(i);
  }
  if (unassigned.length > 0) {
    result.groups.push({ label: "Other Feedback", itemIds: unassigned, duplicates: [] });
  }
  return result;
}

// ── Call 1: Constrain to max 7 + identify duplicates ──

async function call1Constrain(items: FeedbackItem[]): Promise<GroupingResult> {
  const itemList = buildItemList(items);

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are a product analyst. Do TWO things:

1. GROUP these feedback items into AT MOST 7 topics. Be aggressive about merging — items about the same product area belong together even if they're different types (bugs + features about MCP = one group).

2. FIND DUPLICATES within each group. If two items are saying the same thing in different words, mark them as duplicates. Keep the more detailed one, remove the shorter/vaguer one. Only flag true duplicates — two items about the same area but different specific issues are NOT duplicates.

Example duplicate: "sidebar has too many tabs" and "the sidebar tabs are annoying to navigate" = same complaint.
NOT duplicate: "MCP auth is broken" and "MCP needs batch API" = same area but different issues.

Rules:
- AT MOST 7 groups
- Every item must appear in exactly one group's itemIds (including items that get marked as duplicates — list ALL ids in itemIds, then specify which are duplicates)
- Duplicates: "kept" is the item to keep, "removed" is the list of items that are duplicates of it
- Clear labels (2-5 words)`,
    },
    { role: "user", content: `Process these ${items.length} feedback items:\n\n${itemList}` },
  ];

  const result = await callLLMStructured<GroupingResult>(MODELS.NANO, messages, GROUPING_SCHEMA);
  ensureAllAssigned(result, items.length);

  const totalDupes = result.groups.reduce((n, g) => n + g.duplicates.reduce((n2, d) => n2 + d.removed.length, 0), 0);
  console.log(`[cluster] Call 1 → ${result.groups.length} groups, ${totalDupes} duplicates`);

  return result;
}

// ── Call 2: Review and split if needed ──

async function call2Review(constrained: GroupingResult, items: FeedbackItem[]): Promise<GroupingResult> {
  const itemList = buildItemList(items);
  const constrainedSummary = buildGroupSummary(constrained);

  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `Review this feedback grouping. The items were aggressively grouped into ${constrained.groups.length} topics.

Your job:
1. SPLIT any group that contains clearly unrelated items. A group about "MCP" with both bugs and features = fine. A group mixing "billing" and "editor bugs" = split.
2. VERIFY duplicates are correct. If a "duplicate" is actually a different issue, un-mark it.
3. FIND any duplicates that were missed in the first pass.
4. RENAME groups for clarity if needed.

Only split when truly necessary. If all groups look fine, return them unchanged.
Every item must remain assigned to exactly one group.`,
    },
    {
      role: "user",
      content: `Groups to review:\n\n${constrainedSummary}\n\nOriginal items:\n${itemList}\n\nReturn the final grouping:`,
    },
  ];

  const result = await callLLMStructured<GroupingResult>(MODELS.NANO, messages, GROUPING_SCHEMA);
  ensureAllAssigned(result, items.length);

  const totalDupes = result.groups.reduce((n, g) => n + g.duplicates.reduce((n2, d) => n2 + d.removed.length, 0), 0);
  console.log(`[cluster] Call 2 → ${result.groups.length} groups, ${totalDupes} duplicates (final)`);

  return result;
}

// ── Coherence scoring ──

function computeGroupCoherence(dedupGroups: DedupGroup[]): number {
  if (dedupGroups.length <= 1) return 1.0;
  let totalSim = 0, pairs = 0;
  for (let i = 0; i < dedupGroups.length; i++) {
    for (let j = i + 1; j < dedupGroups.length; j++) {
      totalSim += cosineSimilarity(dedupGroups[i].primary.embedding, dedupGroups[j].primary.embedding);
      pairs++;
    }
  }
  return pairs > 0 ? totalSim / pairs : 1.0;
}

// ── Build TopicClusters from GroupingResult ──

function buildTopicClusters(result: GroupingResult, items: FeedbackItem[]): { clusters: TopicCluster[]; dedupCount: number } {
  const clusters: TopicCluster[] = [];
  let totalDedupCount = 0;

  for (const group of result.groups) {
    const validIds = group.itemIds.filter((id) => id >= 0 && id < items.length);
    if (validIds.length === 0) continue;

    // Build dedup groups from the LLM's duplicate markings
    const removedIds = new Set<number>();
    const keptToMerged = new Map<number, number[]>();

    for (const dup of group.duplicates) {
      if (dup.kept >= 0 && dup.kept < items.length) {
        const mergedIds = dup.removed.filter(r => r >= 0 && r < items.length);
        for (const r of mergedIds) removedIds.add(r);
        keptToMerged.set(dup.kept, [...(keptToMerged.get(dup.kept) || []), ...mergedIds]);
      }
    }

    totalDedupCount += removedIds.size;

    const dedupGroups: DedupGroup[] = [];
    for (const id of validIds) {
      if (removedIds.has(id)) continue; // skip — it's merged into another item

      const merged = (keptToMerged.get(id) || []).map(mid => items[mid]);
      dedupGroups.push({
        primary: items[id],
        merged,
        count: 1 + merged.length,
      });
    }

    if (dedupGroups.length === 0) continue;

    const centroid = computeCentroid(dedupGroups.map(g => g.primary.embedding));
    const coherence = computeGroupCoherence(dedupGroups);

    clusters.push({
      label: group.label,
      items: dedupGroups,
      centroid,
      totalReportCount: dedupGroups.reduce((sum, g) => sum + g.count, 0),
      uniqueCount: dedupGroups.length,
      coherenceScore: Math.round(coherence * 1000) / 1000,
    });
  }

  return { clusters, dedupCount: totalDedupCount };
}

// ── Public API ──

export async function clusterItems(items: FeedbackItem[]): Promise<{
  dedupGroups: DedupGroup[];
  topicClusters: TopicCluster[];
  dedupCount: number;
}> {
  // Call 1: Constrain + dedup
  const constrained = await call1Constrain(items);

  // Call 2: Review + split + verify dedup
  const final = await call2Review(constrained, items);

  // Build clusters
  const { clusters: topicClusters, dedupCount } = buildTopicClusters(final, items);

  // Flat list of all dedup groups for analytics
  const dedupGroups: DedupGroup[] = topicClusters.flatMap(tc => tc.items);

  return { dedupGroups, topicClusters, dedupCount };
}

export function nearestNeighborSimilarity(group: DedupGroup, cluster: TopicCluster): number {
  let maxSim = 0;
  for (const other of cluster.items) {
    if (other.primary.index === group.primary.index) continue;
    const sim = cosineSimilarity(group.primary.embedding, other.primary.embedding);
    if (sim > maxSim) maxSim = sim;
  }
  return maxSim;
}
