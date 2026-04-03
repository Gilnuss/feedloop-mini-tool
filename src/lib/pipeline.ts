/**
 * Pipeline orchestrator — two-pass clustering.
 * scrub → classify+embed (parallel) → dedup (pass 1) → topic cluster (pass 2) → summarize → stats
 */

import { scrubPII } from "./scrubber";
import { classifyBatch } from "./classify";
import { getEmbeddingsBatch } from "./embeddings";
import { clusterItems, cosineSimilarity, nearestNeighborSimilarity } from "./cluster";
import { summarizeClusters } from "./summarize";
import { estimateCost, recordRun } from "./analytics";
import { saveResult } from "./resultStore";
import type {
  FeedbackItem,
  Cluster,
  DecodeResult,
  DecodeStats,
  RunAnalytics,
  ItemAnalytics,
  ProgressEvent,
} from "./types";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const KIND_ORDER: Record<string, number> = {
  bug_ticket: 0,
  feature_ticket: 1,
  epic: 2,
};

/**
 * Run the full decode pipeline on a list of raw feedback items.
 */
export async function decodeFeedback(
  rawItems: string[],
  onProgress?: (event: ProgressEvent) => void,
): Promise<DecodeResult> {
  const runStart = Date.now();
  const runId = Math.random().toString(36).slice(2, 12);
  const emit = (event: ProgressEvent) => onProgress?.(event);

  // ── Step 1: PII Scrub ──
  emit({ stage: "scrubbing", progress: 0 });
  const scrubStart = Date.now();
  const scrubbed = rawItems.map((text) => scrubPII(text).cleaned);
  const scrubMs = Date.now() - scrubStart;

  // ── Step 2: Classify + Embed in parallel ──
  emit({ stage: "classifying", progress: 10, detail: `0/${rawItems.length} items...` });
  const parallelStart = Date.now();

  const [classifications, embeddings] = await Promise.all([
    classifyBatch(scrubbed, (done, total) => {
      emit({ stage: "classifying", progress: 10 + Math.round((done / total) * 25), detail: `${done}/${total} items...` });
    }),
    getEmbeddingsBatch(scrubbed, (done, total) => {
      emit({ stage: "embedding", progress: 35 + Math.round((done / total) * 25), detail: `${done}/${total} items...` });
    }),
  ]);

  const classifyMs = Date.now() - parallelStart;
  const embedMs = classifyMs; // ran in parallel

  // Build FeedbackItems
  const feedbackItems: FeedbackItem[] = rawItems.map((text, i) => ({
    index: i,
    text,
    cleaned: scrubbed[i],
    classification: classifications[i],
    embedding: embeddings[i],
  }));

  // ── Step 3: Two-Pass Clustering ──
  emit({ stage: "clustering", progress: 65, detail: "Deduplicating + grouping by topic..." });
  const clusterStart = Date.now();

  const { topicClusters, dedupCount } = await clusterItems(feedbackItems);

  const clusterMs = Date.now() - clusterStart;

  // ── Step 4: Summarize each topic cluster ──
  emit({ stage: "summarizing", progress: 70, detail: `0/${topicClusters.length} topics...` });
  const summarizeStart = Date.now();

  const summaries = await summarizeClusters(topicClusters, (done, total) => {
    emit({ stage: "summarizing", progress: 70 + Math.round((done / total) * 25), detail: `${done}/${total} topics...` });
  });

  const summarizeMs = Date.now() - summarizeStart;

  // ── Build Clusters ──
  const clusters: Cluster[] = topicClusters.map((tc, i) => {
    // Flatten all items from all dedup groups
    const allItems: FeedbackItem[] = [];
    let dedupCountForCluster = 0;
    for (const group of tc.items) {
      allItems.push(group.primary);
      allItems.push(...group.merged);
      dedupCountForCluster += group.merged.length;
    }

    return {
      id: i,
      items: allItems,
      title: summaries[i].title,
      summary: summaries[i].summary,
      kind: summaries[i].kind,
      type: summaries[i].type,
      severity: summaries[i].severity,
      acceptanceCriteria: summaries[i].kind !== "epic" ? (summaries[i] as { acceptanceCriteria: string[] }).acceptanceCriteria : [],
      stories: summaries[i].kind === "epic" ? (summaries[i] as { stories: string[] }).stories : [],
      followUpQuestions: summaries[i].followUpQuestions || [],
      reportCount: tc.totalReportCount,
      dedupCount: dedupCountForCluster,
    };
  });

  // Sort: bugs first, then features, then epics. Within each, by severity then count.
  clusters.sort((a, b) => {
    const kindDiff = (KIND_ORDER[a.kind] ?? 2) - (KIND_ORDER[b.kind] ?? 2);
    if (kindDiff !== 0) return kindDiff;
    const sevDiff = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
    if (sevDiff !== 0) return sevDiff;
    return b.reportCount - a.reportCount;
  });

  // ── Stats ──
  const uniqueSignals = rawItems.length - dedupCount;
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  for (const item of feedbackItems) {
    byType[item.classification.type] = (byType[item.classification.type] || 0) + 1;
    bySeverity[item.classification.severity] = (bySeverity[item.classification.severity] || 0) + 1;
  }
  const byKind: Record<string, number> = {};
  for (const c of clusters) {
    byKind[c.kind] = (byKind[c.kind] || 0) + 1;
  }

  const stats: DecodeStats = {
    inputCount: rawItems.length,
    uniqueSignals,
    duplicateCount: dedupCount,
    issueCount: clusters.length,
    hoursSaved: Math.round((rawItems.length * 2.5) / 60 * 10) / 10,
    byType,
    bySeverity,
    byKind,
  };

  // ── Analytics ──
  const itemAnalytics: ItemAnalytics[] = feedbackItems.map((item) => {
    const cluster = clusters.find((c) => c.items.some((ci) => ci.index === item.index));
    const clusterId = cluster?.id ?? -1;
    const tc = topicClusters[clusterId];
    const centroid = tc?.centroid || [];
    const simToCentroid = centroid.length > 0 ? cosineSimilarity(item.embedding, centroid) : 0;

    // Find nearest neighbor in same topic cluster
    let nearestSim = 0;
    if (tc) {
      for (const group of tc.items) {
        if (group.primary.index !== item.index) {
          const sim = cosineSimilarity(item.embedding, group.primary.embedding);
          if (sim > nearestSim) nearestSim = sim;
        }
      }
    }

    return {
      index: item.index,
      originalText: item.text.slice(0, 100),
      classification: item.classification,
      clusterId,
      similarityToClusterCentroid: Math.round(simToCentroid * 1000) / 1000,
      nearestNeighborSimilarity: Math.round(nearestSim * 1000) / 1000,
    };
  });

  const totalMs = Date.now() - runStart;

  const analytics: RunAnalytics = {
    runId,
    timestamp: new Date().toISOString(),
    timings: { total: totalMs, scrub: scrubMs, classify: classifyMs, embed: embedMs, cluster: clusterMs, summarize: summarizeMs },
    counts: { input: rawItems.length, afterScrub: scrubbed.length, clusters: clusters.length, duplicatesFound: dedupCount },
    items: itemAnalytics,
    cost: {
      estimated: estimateCost(rawItems.length, rawItems.length, clusters.length),
      classifyCalls: rawItems.length,
      embedCalls: rawItems.length,
      summarizeCalls: clusters.length,
    },
  };

  recordRun(analytics);

  const result: DecodeResult = { id: "", stats, clusters, analytics };
  const resultId = saveResult(result);
  result.id = resultId;

  emit({ stage: "done", progress: 100 });

  console.log(
    `[pipeline] Done: ${rawItems.length} items → ${dedupCount} dupes merged → ${uniqueSignals} unique → ${clusters.length} actionable items (${byKind.bug_ticket || 0} bugs, ${byKind.feature_ticket || 0} features, ${byKind.epic || 0} epics) in ${(totalMs / 1000).toFixed(1)}s (~$${analytics.cost.estimated.toFixed(4)})`,
  );

  return result;
}
