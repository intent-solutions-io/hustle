/**
 * Claude SDK wrapper.
 *
 * Thin, single-purpose adapter around `@anthropic-ai/sdk` so every AI call
 * site in the app talks to one function with one shape. Keeps the SDK
 * surface (and any future swap) confined to this file.
 *
 * Design choices:
 *   - One exported function: `generateText`. Inputs are the four levers
 *     callers actually need (system, user, maxTokens, temperature) plus
 *     an optional model override for callers that want something other
 *     than the default Sonnet.
 *   - Returns a plain `string` (every text block concatenated) so callers
 *     don't have to understand the content-block array.
 *   - Errors come back as `ClaudeError`, which preserves the original
 *     SDK error as `cause` for debugging without leaking the SDK shape
 *     into every catch.
 *   - The `Anthropic` client is lazily instantiated and cached so the
 *     module is safe to import in test environments where the API key
 *     is unset (callers handle the no-key path; this module just refuses
 *     to construct without it).
 */

import Anthropic from '@anthropic-ai/sdk';

// Default model. Callers can override via `generateText({ model })`.
// Pinned to a Sonnet build; bumping happens here, not at every call site.
export const DEFAULT_MODEL = 'claude-sonnet-4-6';

export interface GenerateTextInput {
  /** System prompt — role/persona/constraints. */
  system: string;
  /** User prompt — the actual request. */
  user: string;
  /** Hard cap on output tokens. */
  maxTokens: number;
  /** Sampling temperature, 0.0–1.0. */
  temperature: number;
  /** Optional model override. Defaults to {@link DEFAULT_MODEL}. */
  model?: string;
}

/**
 * Wrapper error so callers can `catch (e) { if (e instanceof ClaudeError) ... }`
 * without importing anything from the SDK package.
 */
export class ClaudeError extends Error {
  override readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ClaudeError';
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

// ───────────────────────── Client construction ─────────────────────────

let _client: Anthropic | null = null;

/**
 * Resolve the singleton client. Throws `ClaudeError` when the API key
 * is not configured — callers that want a no-key fallback (e.g.
 * `lib/ai/workout-strategy.ts`) must check `process.env.ANTHROPIC_API_KEY`
 * themselves before calling `generateText`.
 */
function getClient(): Anthropic {
  if (_client) return _client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeError(
      'ANTHROPIC_API_KEY is not set; cannot construct Anthropic client.',
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

/**
 * Test-only hook. Resets the cached client so the next call re-reads
 * `process.env.ANTHROPIC_API_KEY` and re-instantiates `Anthropic`.
 * Exported because vitest mocks the constructor and needs the singleton
 * cleared between tests.
 */
export function _resetClientForTests(): void {
  _client = null;
}

// ───────────────────────── Public API ─────────────────────────

/**
 * Generate text from Claude. Concatenates every text content block in
 * the response into a single string and returns it.
 *
 * Throws {@link ClaudeError} on any underlying failure (network, API,
 * SDK validation, etc.) so callers have one error type to handle.
 */
export async function generateText(input: GenerateTextInput): Promise<string> {
  const { system, user, maxTokens, temperature, model = DEFAULT_MODEL } = input;

  let result;
  try {
    const client = getClient();
    result = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: user }],
    });
  } catch (err) {
    if (err instanceof ClaudeError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new ClaudeError(`Anthropic API call failed: ${msg}`, { cause: err });
  }

  // Concatenate every text block. Non-text blocks (tool_use, etc.) are
  // ignored because this wrapper only does plain text generation.
  const text = result.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> =>
      block.type === 'text',
    )
    .map((b) => b.text)
    .join('');

  return text;
}
