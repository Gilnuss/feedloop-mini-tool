/**
 * Shared types for FeedLoop Decode mini-tool.
 */

// ── Classification ──

export interface ClassifyResult {
  type: "bug" | "feature" | "feedback";
  severity: "low" | "medium" | "high" | "critical";
  productArea: string;
  confidence: number;
}

// "feedback" = valid signal but not a specific bug or feature request
// (e.g., "not suitable for large teams" — strategic/general feedback)

// ── Pipeline Items ──

export interface FeedbackItem {
  index: number;
  text: string;
  cleaned: string;
  classification: ClassifyResult;
  embedding: number[];
}

// ── Clusters ──

export interface Cluster {
  id: number;
  items: FeedbackItem[];
  title: string;
  summary: string;
  kind: "bug_ticket" | "feature_ticket" | "epic";
  type: "bug" | "feature" | "feedback";
  severity: "low" | "medium" | "high" | "critical";
  acceptanceCriteria: string[];  // for bug/feature tickets
  stories: string[];             // for epics — sub-story suggestions
  reportCount: number;
  dedupCount: number;            // how many near-identical items were merged in pass 1
}

// ── Results ──

export interface DecodeStats {
  inputCount: number;
  uniqueSignals: number;         // after pass 1 dedup
  duplicateCount: number;        // items merged in pass 1
  issueCount: number;            // final topic clusters after pass 2
  hoursSaved: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byKind: Record<string, number>; // bug_ticket / feature_ticket / epic
}

export interface DecodeResult {
  id: string;
  stats: DecodeStats;
  clusters: Cluster[];
  analytics: RunAnalytics;
}

// ── Analytics ──

export interface RunAnalytics {
  runId: string;
  timestamp: string;
  timings: {
    total: number;
    scrub: number;
    classify: number;
    embed: number;
    cluster: number;
    summarize: number;
  };
  counts: {
    input: number;
    afterScrub: number;
    clusters: number;
    duplicatesFound: number;
  };
  items: ItemAnalytics[];
  cost: {
    estimated: number;
    classifyCalls: number;
    embedCalls: number;
    summarizeCalls: number;
  };
}

export interface ItemAnalytics {
  index: number;
  originalText: string; // truncated to 100 chars
  classification: ClassifyResult;
  clusterId: number;
  similarityToClusterCentroid: number;
  nearestNeighborSimilarity: number;
}

// ── SSE Progress ──

export interface ProgressEvent {
  stage: "scrubbing" | "classifying" | "embedding" | "clustering" | "summarizing" | "done";
  progress: number; // 0-100
  detail?: string;
}
