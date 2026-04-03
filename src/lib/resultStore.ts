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

import { randomBytes } from "crypto";

const MAX_STORE_SIZE = 500;

/**
 * Generate a cryptographically secure random ID.
 */
function generateId(): string {
  return randomBytes(16).toString("base64url").slice(0, 20);
}

/**
 * Save a decode result and return its shareable ID.
 */
export function saveResult(result: DecodeResult): string {
  // Evict oldest if at capacity
  if (store.size >= MAX_STORE_SIZE) {
    let oldestKey = "";
    let oldestTime = Infinity;
    for (const [key, entry] of store) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }
    if (oldestKey) store.delete(oldestKey);
  }

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
