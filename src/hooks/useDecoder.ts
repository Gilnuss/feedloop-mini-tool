/**
 * useDecoder — orchestrates the decode pipeline via SSE.
 * Manages: input text, CSV upload, state transitions, real-time progress, results.
 */

"use client";

import { useState, useCallback, useRef } from "react";
import type { DecodeResult, ProgressEvent } from "@/lib/types";

export type DecoderPhase =
  | { phase: "input" }
  | { phase: "processing"; stage: string; progress: number; detail?: string }
  | { phase: "results"; data: DecodeResult }
  | { phase: "error"; message: string };

export function useDecoder() {
  const [state, setState] = useState<DecoderPhase>({ phase: "input" });
  const [inputText, setInputText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const itemCount = inputText
    .split("\n")
    .filter((line) => line.trim().length > 0).length;

  const canDecode = itemCount >= 10 && itemCount <= 100;

  const decode = useCallback(async (items?: string[]) => {
    // Parse items from input text if not provided
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
        const errorData = await response.json().catch(() => ({}));
        setState({
          phase: "error",
          message: errorData.error || `Request failed (${response.status})`,
        });
        return;
      }

      if (!response.body) {
        setState({ phase: "error", message: "No response stream" });
        return;
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep incomplete message in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "progress") {
              setState({
                phase: "processing",
                stage: data.stage,
                progress: data.progress,
                detail: data.detail,
              });
            } else if (data.type === "result") {
              setState({ phase: "results", data: data.data });
            } else if (data.type === "error") {
              setState({ phase: "error", message: data.message });
            }
          } catch {
            // Skip malformed messages
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setState({
        phase: "error",
        message: "Connection failed. Please try again.",
      });
    }
  }, [inputText]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ phase: "input" });
  }, []);

  const loadSampleData = useCallback((items: string[]) => {
    setInputText(items.join("\n"));
  }, []);

  return {
    state,
    inputText,
    setInputText,
    itemCount,
    canDecode,
    decode,
    reset,
    loadSampleData,
  };
}
