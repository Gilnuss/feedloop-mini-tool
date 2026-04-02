/**
 * Result store — in-memory for dev, swap to Vercel KV for prod.
 * Stores decode results for shareable URLs.
 */

import type { DecodeResult } from "./types";

interface StoredResult {
  result: DecodeResult;
  createdAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for dev
const store = new Map<string, StoredResult>();

// Auto-cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(id);
    }
  }
}, 10 * 60 * 1000);

/**
 * Generate a short random ID.
 */
function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Save a decode result and return its shareable ID.
 */
export function saveResult(result: DecodeResult): string {
  const id = generateId();
  result.id = id;
  store.set(id, { result, createdAt: Date.now() });
  return id;
}

/**
 * Retrieve a stored decode result by ID.
 */
export function getResult(id: string): DecodeResult | null {
  const entry = store.get(id);
  if (!entry) return null;

  // Check TTL
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(id);
    return null;
  }

  return entry.result;
}

/**
 * Get count of stored results (for monitoring).
 */
export function getStoreSize(): number {
  return store.size;
}
