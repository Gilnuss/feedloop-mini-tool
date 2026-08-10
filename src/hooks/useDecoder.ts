/**
 * useDecoder — orchestrates the decode pipeline via SSE.
 * Manages: input text, CSV upload, state transitions, real-time progress, results.
 * Persists last result to localStorage so it survives page refresh.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { DecodeResult } from "@/lib/types";
import { track } from "@/lib/track";

const STORAGE_KEY = "feedloop-decode-last-result";
const INPUT_STORAGE_KEY = "feedloop-decode-last-input";
const SOURCE_STORAGE_KEY = "feedloop-decode-last-source";

/**
 * Where the current input came from. This is THE distinction the funnel exists
 * to make: clicking a sample is curiosity, pasting your own feedback is the
 * value signal — so it has to survive the same localStorage round trip the
 * input itself does, or a restored sample gets miscounted as own data.
 */
type InputSource = "sample" | "own" | "unknown";

export type DecoderPhase =
  | { phase: "input" }
  | { phase: "processing"; stage: string; progress: number; detail?: string }
  | { phase: "results"; data: DecodeResult }
  | { phase: "error"; message: string };

function loadCachedResult(): DecodeResult | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Check if it's recent (24h)
    if (parsed._cachedAt && Date.now() - parsed._cachedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as DecodeResult;
  } catch {
    return null;
  }
}

function cacheResult(result: DecodeResult) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...result, _cachedAt: Date.now() }));
  } catch { /* storage full, ignore */ }
}

function loadCachedInput(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(INPUT_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function cacheInput(text: string) {
  try {
    localStorage.setItem(INPUT_STORAGE_KEY, text);
  } catch { /* ignore */ }
}

function loadCachedSource(): InputSource {
  if (typeof window === "undefined") return "unknown";
  try {
    const stored = localStorage.getItem(SOURCE_STORAGE_KEY);
    return stored === "sample" || stored === "own" ? stored : "unknown";
  } catch {
    return "unknown";
  }
}

function cacheSource(source: InputSource) {
  try {
    localStorage.setItem(SOURCE_STORAGE_KEY, source);
  } catch { /* ignore */ }
}

export function useDecoder() {
  const [state, setState] = useState<DecoderPhase>({ phase: "input" });
  const [inputText, setInputTextRaw] = useState("");
  const [initialized, setInitialized] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Held in a ref so decode() reads it without needing to re-create the
   * callback. Defaults to "unknown" rather than "own" — an unattributed run
   * must never be silently counted as the value signal.
   */
  const inputSourceRef = useRef<InputSource>("unknown");

  /** Anything the user types, pastes or uploads is their own data. */
  const setInputText = useCallback((text: string) => {
    inputSourceRef.current = "own";
    cacheSource("own");
    setInputTextRaw(text);
  }, []);

  // On mount: restore cached result or input
  useEffect(() => {
    track("landed", { once: true });

    const cached = loadCachedResult();
    if (cached) {
      // Restoring a previous run is NOT reached_results (no run happened),
      // but the session did see results — it belongs in the denominator of
      // resultsToTrial, or a later trial click becomes an impossible >100%.
      track("viewed_cached_results");
      setState({ phase: "results", data: cached });
    } else {
      const cachedInput = loadCachedInput();
      if (cachedInput) {
        // Restore provenance with the text, so a cached sample stays a sample.
        inputSourceRef.current = loadCachedSource();
        setInputTextRaw(cachedInput);
      }
    }
    setInitialized(true);
  }, []);

  // Cache input as user types
  useEffect(() => {
    if (initialized && state.phase === "input") {
      cacheInput(inputText);
    }
  }, [inputText, initialized, state.phase]);

  const itemCount = inputText
    .split("\n")
    .filter((line) => line.trim().length > 0).length;

  const canDecode = itemCount >= 10 && itemCount <= 100;

  const decode = useCallback(async (items?: string[]) => {
    const feedbackItems = items || inputText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (feedbackItems.length < 10) {
      setState({ phase: "error", message: "Need at least 10 feedback items." });
      return;
    }

    if (feedbackItems.length > 100) {
      setState({ phase: "error", message: "Maximum 100 items. You have " + feedbackItems.length + "." });
      return;
    }

    // Fired once the input has passed validation, so it counts real attempts
    // rather than clicks on a disabled button.
    const source = inputSourceRef.current;
    track(
      source === "sample" ? "ran_sample"
        : source === "own" ? "ran_own_data"
        : "ran_unknown_source",
    );

    setState({ phase: "processing", stage: "scrubbing", progress: 0 });
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: feedbackItems }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        // 429 is a capacity decision we made, not a product failure — keep it
        // in its own bucket so it never reads as lack of interest.
        track(response.status === 429 ? "rate_limited" : "decode_failed");
        const errorData = await response.json().catch(() => ({}));
        setState({ phase: "error", message: errorData.error || `Request failed (${response.status})` });
        return;
      }

      if (!response.body) {
        track("decode_failed");
        setState({ phase: "error", message: "No response stream" });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") {
              setState({ phase: "processing", stage: data.stage, progress: data.progress, detail: data.detail });
            } else if (data.type === "result") {
              const result = data.data as DecodeResult;
              cacheResult(result);
              // Only on a real completion — restoring a cached result on mount
              // must not count as reaching results.
              track("reached_results");
              setState({ phase: "results", data: result });
            } else if (data.type === "error") {
              // `reason` comes from the decode route; fall back to the message
              // text for responses predating that field.
              const timedOut = data.reason === "timeout"
                || /timed out/i.test(String(data.message || ""));
              track(timedOut ? "decode_timeout" : "decode_failed");
              setState({ phase: "error", message: data.message });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      // A deliberate abort (reset / new analysis) is not a failure.
      if (err instanceof Error && err.name === "AbortError") return;
      track("decode_failed");
      setState({ phase: "error", message: "Connection failed. Please try again." });
    }
  }, [inputText]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INPUT_STORAGE_KEY);
    localStorage.removeItem(SOURCE_STORAGE_KEY);
    inputSourceRef.current = "unknown";
    setInputTextRaw("");
    setState({ phase: "input" });
  }, []);

  const runAgain = useCallback(() => {
    // Re-run with the same input that produced the current result
    const cachedInput = loadCachedInput();
    if (cachedInput) {
      const items = cachedInput.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      if (items.length >= 10) {
        localStorage.removeItem(STORAGE_KEY);
        decode(items);
        return;
      }
    }
    // Fallback: go back to input
    reset();
  }, [decode, reset]);

  const loadSampleData = useCallback((items: string[]) => {
    inputSourceRef.current = "sample";
    cacheSource("sample");
    setInputTextRaw(items.join("\n"));
  }, []);

  return {
    state,
    inputText,
    setInputText,
    itemCount,
    canDecode,
    decode,
    reset,
    runAgain,
    loadSampleData,
    initialized,
  };
}
