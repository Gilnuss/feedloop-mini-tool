import type { Metadata } from "next";
import { SharedResultClient } from "./client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Try to fetch the result for dynamic OG tags
  // In production this would be a direct store read; for now use API
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/results/${id}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return {
        title: `${data.stats.inputCount} feedback items decoded into ${data.stats.issueCount} real issues`,
        description: `See the breakdown — classified, deduplicated, and clustered by FeedLoop Decode`,
        openGraph: {
          title: `${data.stats.inputCount} items → ${data.stats.issueCount} issues`,
          description: `${data.stats.duplicateCount} duplicates merged. ${data.stats.issueCount} actionable items created. Decoded by FeedLoop.`,
          type: "website",
          siteName: "FeedLoop Decode",
        },
      };
    }
  } catch {
    // Fallback metadata
  }

  return {
    title: "FeedLoop Decode — Shared Results",
    description: "See how messy user feedback was decoded into actionable tickets.",
  };
}

export default async function SharedResultPage({ params }: Props) {
  const { id } = await params;
  return <SharedResultClient id={id} />;
}
