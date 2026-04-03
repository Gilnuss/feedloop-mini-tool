/**
 * Simplified embedding client — OpenRouter only.
 * Adapted from FeedLoop packages/shared/src/embeddings/client.ts
 */

const MAX_RETRIES = 6;
const TARGET_DIMS = 1024;
const TIMEOUT_MS = 30_000;
const BATCH_SIZE = 20;

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
  usage?: { total_tokens: number; cost?: number };
}

const MAX_TEXT_LENGTH = 2000;

/**
 * Generate a 1024-dim embedding for a single text via OpenRouter.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  // Defense-in-depth: truncate oversized text before sending to API
  const truncatedText = text.slice(0, MAX_TEXT_LENGTH);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: truncatedText,
        dimensions: TARGET_DIMS,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (res.status === 429) {
      if (attempt === MAX_RETRIES) {
        throw new Error(`Embedding rate limited after ${MAX_RETRIES + 1} attempts`);
      }
      const delay = Math.pow(2, attempt + 1) * 1000 + Math.random() * 5000;
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Embedding error ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as EmbeddingResponse;
    const embedding = data.data?.[0]?.embedding;

    if (!embedding || embedding.length === 0) {
      throw new Error("Empty embedding returned");
    }

    return embedding;
  }

  throw new Error("Unexpected: exceeded embedding retry loop");
}

/**
 * Generate embeddings for multiple texts in parallel batches.
 * Returns embeddings in the same order as input texts.
 */
export async function getEmbeddingsBatch(
  texts: string[],
  onProgress?: (completed: number, total: number) => void,
): Promise<number[][]> {
  const results: number[][] = new Array(texts.length);
  let completed = 0;

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((text) => getEmbedding(text)),
    );

    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
      completed++;
      onProgress?.(completed, texts.length);
    }
  }

  return results;
}
