/**
 * Analytics tracker — stores per-run and per-item data in-memory.
 * For dev/early stage. Later: swap to file/SQLite/Vercel KV.
 */

import type { RunAnalytics } from "./types";

// In-memory store — persists only for the lifetime of the server process
const runs: RunAnalytics[] = [];

// Cost estimates per API call (USD)
const COSTS = {
  classifyCall: 0.00016, // Haiku: ~500 in + ~100 out tokens
  embedCall: 0.000002, // text-embedding-3-small: ~100 tokens
  groupingCall: 0.002, // Haiku: ~2000 in + ~500 out (single call for all items)
  summarizeCall: 0.0007, // Haiku: ~800 in + ~300 out tokens
};

/**
 * Record a completed pipeline run.
 */
export function recordRun(analytics: RunAnalytics): void {
  runs.push(analytics);

  // Keep max 1000 entries to prevent memory bloat
  if (runs.length > 1000) {
    runs.splice(0, runs.length - 1000);
  }
}

/**
 * Get all recorded runs.
 */
export function getAllRuns(): RunAnalytics[] {
  return [...runs];
}

/**
 * Get summary stats across all runs.
 */
export function getRunsSummary() {
  if (runs.length === 0) return null;

  const totalCost = runs.reduce((sum, r) => sum + r.cost.estimated, 0);
  const avgTime = runs.reduce((sum, r) => sum + r.timings.total, 0) / runs.length;
  const avgClusters = runs.reduce((sum, r) => sum + r.counts.clusters, 0) / runs.length;
  const totalItems = runs.reduce((sum, r) => sum + r.counts.input, 0);

  return {
    totalRuns: runs.length,
    totalItemsProcessed: totalItems,
    totalEstimatedCost: Math.round(totalCost * 10000) / 10000,
    avgTimeMs: Math.round(avgTime),
    avgClusters: Math.round(avgClusters * 10) / 10,
  };
}

/**
 * Estimate cost for a pipeline run based on call counts.
 */
export function estimateCost(classifyCalls: number, embedCalls: number, summarizeCalls: number): number {
  return (
    classifyCalls * COSTS.classifyCall +
    embedCalls * COSTS.embedCall +
    COSTS.groupingCall + // single LLM grouping call
    summarizeCalls * COSTS.summarizeCall
  );
}
