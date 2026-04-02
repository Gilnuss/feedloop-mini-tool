/**
 * Simplified LLM client for the mini-tool.
 * Adapted from FeedLoop packages/shared/src/llm/client.ts
 * Stripped: recordUsage, getLLMTimeout, heartbeat. Hardcoded 30s timeout.
 */

export const MODELS = {
  /** Ultra-fast + cheapest — classification, extraction (GPT 5.4 Nano) */
  NANO: "openai/gpt-5.4-nano",
  /** Fast + cheap — summarization, grouping (Haiku) */
  FAST: "anthropic/claude-haiku-4.5",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  json?: boolean;
  /** JSON Schema for structured outputs (GPT models only) */
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  maxTokens?: number;
  temperature?: number;
  retries?: number;
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost?: number;
  };
}

const TIMEOUT_MS = 60_000;

export async function callLLM(
  model: ModelId | string,
  messages: LLMMessage[],
  options: LLMOptions = {},
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const { json = false, maxTokens, temperature = 0, retries = 2 } = options;

  const body: Record<string, unknown> = { model, messages, temperature };
  if (maxTokens !== undefined) body.max_tokens = maxTokens;

  if (options.jsonSchema) {
    // Structured outputs — strict JSON schema enforcement (GPT models)
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: options.jsonSchema.name,
        strict: true,
        schema: options.jsonSchema.schema,
      },
    };
  } else if (json) {
    body.response_format = { type: "json_object" };
  }

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://decode.feedloop.dev",
        "X-Title": "FeedLoop Decode",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return callLLM(model, messages, { ...options, retries: retries - 1 });
    }
    throw new Error(`LLM request failed: ${errMsg}`);
  }

  if (!res.ok) {
    const text = await res.text();
    if (retries > 0 && (res.status >= 500 || res.status === 429)) {
      const delay = res.status === 429 ? 5000 : 2000;
      await new Promise((r) => setTimeout(r, delay));
      return callLLM(model, messages, { ...options, retries: retries - 1 });
    }
    throw new Error(`OpenRouter API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned empty response");

  return content;
}

export async function callLLMJson<T = unknown>(
  model: ModelId | string,
  messages: LLMMessage[],
  options: Omit<LLMOptions, "json"> = {},
): Promise<T> {
  const retries = options.retries ?? 2;
  const raw = await callLLM(model, messages, { ...options, json: true });

  let cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ");
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(cleaned) as T;
  } catch (e1) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch { /* fall through */ }
    }

    if (retries > 0) {
      return callLLMJson<T>(model, [
        ...messages,
        { role: "assistant", content: raw },
        { role: "user", content: "Your response was not valid JSON. Respond with ONLY a valid JSON object." },
      ], { ...options, retries: retries - 1 });
    }
    throw new Error(`JSON parse failed after retries: ${(e1 as Error).message}`);
  }
}

/**
 * Call LLM with structured output (JSON Schema enforcement).
 * Uses response_format.json_schema for strict schema adherence.
 * Only works with models that support structured outputs (GPT family).
 */
export async function callLLMStructured<T = unknown>(
  model: ModelId | string,
  messages: LLMMessage[],
  schema: { name: string; schema: Record<string, unknown> },
  options: Omit<LLMOptions, "json" | "jsonSchema"> = {},
): Promise<T> {
  const raw = await callLLM(model, messages, { ...options, jsonSchema: schema });

  let cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ");

  return JSON.parse(cleaned) as T;
}
