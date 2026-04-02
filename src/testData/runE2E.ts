/**
 * E2E test runner — runs the decode pipeline on all 3 test datasets.
 * Usage: npx tsx src/testData/runE2E.ts [notion|linear|affine]
 */

import { decodeFeedback } from "../lib/pipeline";
import { notionFeedback } from "./notion";
import { linearFeedback } from "./linear";
import { affineFeedback } from "./affine";

const ALL_DATASETS = [
  { name: "Notion", data: notionFeedback },
  { name: "Linear", data: linearFeedback },
  { name: "AFFiNE", data: affineFeedback },
];

async function runTest(name: string, data: string[]) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TESTING: ${name} (${data.length} items)`);
  console.log("=".repeat(60));

  const start = Date.now();

  try {
    const result = await decodeFeedback(data, (event) => {
      if (event.stage === "done" || event.detail) {
        console.log(`  [${event.stage}] ${event.progress}% ${event.detail || ""}`);
      }
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log(`\n--- STATS ---`);
    console.log(`  Input items:     ${result.stats.inputCount}`);
    console.log(`  Duplicates:      ${result.stats.duplicateCount} merged`);
    console.log(`  Unique signals:  ${result.stats.uniqueSignals}`);
    console.log(`  Actionable items: ${result.stats.issueCount}`);
    console.log(`  Hours saved:     ${result.stats.hoursSaved}`);
    console.log(`  By type:     ${JSON.stringify(result.stats.byType)}`);
    console.log(`  By severity: ${JSON.stringify(result.stats.bySeverity)}`);
    console.log(`  By kind:     ${JSON.stringify(result.stats.byKind)}`);

    // Show clusters grouped by kind
    const bugs = result.clusters.filter(c => c.kind === "bug_ticket");
    const features = result.clusters.filter(c => c.kind === "feature_ticket");
    const epics = result.clusters.filter(c => c.kind === "epic");

    if (bugs.length > 0) {
      console.log(`\n--- 🔴 BUG TICKETS (${bugs.length}) ---`);
      for (const c of bugs) {
        console.log(`\n  [${c.severity.toUpperCase()}] ${c.title}`);
        console.log(`  ${c.reportCount} reports | ${c.dedupCount} dupes merged`);
        console.log(`  ${c.summary}`);
        console.log(`  Acceptance criteria:`);
        for (const ac of c.acceptanceCriteria) console.log(`    ✓ ${ac}`);
      }
    }

    if (features.length > 0) {
      console.log(`\n--- 🟡 FEATURE TICKETS (${features.length}) ---`);
      for (const c of features) {
        console.log(`\n  [${c.severity.toUpperCase()}] ${c.title}`);
        console.log(`  ${c.reportCount} reports | ${c.dedupCount} dupes merged`);
        console.log(`  ${c.summary}`);
        console.log(`  Acceptance criteria:`);
        for (const ac of c.acceptanceCriteria) console.log(`    ✓ ${ac}`);
      }
    }

    if (epics.length > 0) {
      console.log(`\n--- 📋 STRATEGIC EPICS (${epics.length}) ---`);
      for (const c of epics) {
        console.log(`\n  [${c.severity.toUpperCase()}] ${c.title}`);
        console.log(`  ${c.reportCount} reports | ${c.dedupCount} dupes merged`);
        console.log(`  ${c.summary}`);
        console.log(`  Stories:`);
        for (const story of c.stories) console.log(`    → ${story}`);
      }
    }

    console.log(`\n--- TIMINGS ---`);
    const t = result.analytics.timings;
    console.log(`  Scrub:      ${t.scrub}ms`);
    console.log(`  Classify:   ${t.classify}ms`);
    console.log(`  Embed:      ${t.embed}ms`);
    console.log(`  Cluster:    ${t.cluster}ms`);
    console.log(`  Summarize:  ${t.summarize}ms`);
    console.log(`  Total:      ${t.total}ms`);
    console.log(`  Est. cost:  $${result.analytics.cost.estimated.toFixed(4)}`);

    // Sanity checks
    const issues: string[] = [];
    if (result.stats.issueCount < 3) issues.push("Too few clusters (< 3)");
    if (result.stats.issueCount > data.length * 0.6) issues.push(`Too many clusters (${result.stats.issueCount} > 60% of ${data.length} input)`);
    if (result.stats.duplicateCount === 0) issues.push("Zero dedup — no near-identical items found");
    if (t.total > 60000) issues.push("Too slow (> 60s)");
    if (result.analytics.cost.estimated > 0.05) issues.push("Too expensive (> $0.05)");

    if (issues.length > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      for (const issue of issues) console.log(`  - ${issue}`);
    } else {
      console.log(`\n✅ All checks passed!`);
    }

    return { name, success: true, clusters: result.stats.issueCount, dupes: result.stats.duplicateCount, elapsed, cost: result.analytics.cost.estimated };
  } catch (error) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`\n❌ FAILED after ${elapsed}s:`, error);
    return { name, success: false, error: String(error) };
  }
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY not set. Run: export $(grep -v '^#' .env.local | xargs)");
    process.exit(1);
  }

  // Allow running a single dataset: npx tsx src/testData/runE2E.ts linear
  const filter = process.argv[2]?.toLowerCase();
  const datasets = filter
    ? ALL_DATASETS.filter(d => d.name.toLowerCase() === filter)
    : ALL_DATASETS;

  if (datasets.length === 0) {
    console.error(`Unknown dataset: ${filter}. Options: notion, linear, affine`);
    process.exit(1);
  }

  console.log(`FeedLoop Decode — E2E Pipeline Test (two-pass clustering)`);
  console.log(`Running ${datasets.length} test(s)...`);

  const results = [];
  for (const { name, data } of datasets) {
    const result = await runTest(name, data);
    results.push(result);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log("=".repeat(60));

  for (const r of results) {
    if ("clusters" in r && "dupes" in r) {
      console.log(`  ${r.success ? "✅" : "❌"} ${r.name}: ${r.dupes} dupes merged → ${r.clusters} actionable items in ${r.elapsed}s (~$${(r.cost as number).toFixed(4)})`);
    } else {
      console.log(`  ❌ ${r.name}: FAILED — ${"error" in r ? r.error : "unknown"}`);
    }
  }

  const totalCost = results
    .filter((r): r is typeof r & { cost: number } => "cost" in r)
    .reduce((sum, r) => sum + r.cost, 0);
  console.log(`\n  Total estimated cost: $${totalCost.toFixed(4)}`);
}

main().catch(console.error);
