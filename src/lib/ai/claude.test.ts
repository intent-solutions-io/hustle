/**
 * Tests for src/lib/ai/claude.ts (Anthropic SDK wrapper).
 *
 * Mocks the `@anthropic-ai/sdk` default export (the `Anthropic` class) so
 * tests verify the wrapper's contract — concatenation, error wrapping,
 * and the no-key path — without making real network calls.
 *
 * Vitest 4 rejects arrow-function mockImplementation as "not a constructor",
 * so the mock has to be a real class declaration (same pattern as
 * src/lib/email.test.ts).
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mock state ────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  messagesCreate: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mocks.messagesCreate };
  },
}));

// Imports must come after vi.mock so the mocked module is wired.
import {
  generateText,
  ClaudeError,
  DEFAULT_MODEL,
  _resetClientForTests,
} from './claude';

// ─── Env-var helper (mirrors email.test.ts) ────────────────────────
function setEnv(vars: Record<string, string | undefined>) {
  const originals: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    originals[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return () => {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

// ─── Tests ─────────────────────────────────────────────────────────
describe('lib/ai/claude', () => {
  let restoreEnv: () => void;

  beforeEach(() => {
    mocks.messagesCreate.mockReset();
    _resetClientForTests();
    restoreEnv = setEnv({ ANTHROPIC_API_KEY: 'test-key-abc' });
  });

  afterEach(() => {
    restoreEnv();
    _resetClientForTests();
  });

  describe('generateText — happy path', () => {
    it('concatenates every text block in the response', async () => {
      mocks.messagesCreate.mockResolvedValue({
        content: [
          { type: 'text', text: 'Hello, ' },
          { type: 'text', text: 'world!' },
        ],
      });

      const result = await generateText({
        system: 'sys',
        user: 'usr',
        maxTokens: 100,
        temperature: 0.5,
      });

      expect(result).toBe('Hello, world!');
    });

    it('ignores non-text content blocks (e.g. tool_use)', async () => {
      mocks.messagesCreate.mockResolvedValue({
        content: [
          { type: 'text', text: 'Real answer.' },
          { type: 'tool_use', id: 'tu_1', name: 'something', input: {} },
        ],
      });

      const result = await generateText({
        system: 's',
        user: 'u',
        maxTokens: 100,
        temperature: 0.5,
      });

      expect(result).toBe('Real answer.');
    });

    it('passes through system, user, model, maxTokens, temperature', async () => {
      mocks.messagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'ok' }],
      });

      await generateText({
        system: 'you are a coach',
        user: 'plan my week',
        maxTokens: 4242,
        temperature: 0.31,
        model: 'claude-opus-4-7',
      });

      expect(mocks.messagesCreate).toHaveBeenCalledTimes(1);
      expect(mocks.messagesCreate).toHaveBeenCalledWith({
        model: 'claude-opus-4-7',
        max_tokens: 4242,
        temperature: 0.31,
        system: 'you are a coach',
        messages: [{ role: 'user', content: 'plan my week' }],
      });
    });

    it('uses DEFAULT_MODEL when no model override is provided', async () => {
      mocks.messagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'ok' }],
      });

      await generateText({
        system: 's',
        user: 'u',
        maxTokens: 100,
        temperature: 0.5,
      });

      const call = mocks.messagesCreate.mock.calls[0][0];
      expect(call.model).toBe(DEFAULT_MODEL);
    });

    it('returns empty string when response has no text blocks', async () => {
      mocks.messagesCreate.mockResolvedValue({ content: [] });

      const result = await generateText({
        system: 's',
        user: 'u',
        maxTokens: 100,
        temperature: 0.5,
      });

      expect(result).toBe('');
    });
  });

  describe('generateText — error wrapping', () => {
    it('wraps SDK errors in ClaudeError and preserves cause', async () => {
      const sdkErr = new Error('429 rate limit');
      mocks.messagesCreate.mockRejectedValue(sdkErr);

      await expect(
        generateText({
          system: 's',
          user: 'u',
          maxTokens: 100,
          temperature: 0.5,
        }),
      ).rejects.toMatchObject({
        name: 'ClaudeError',
        message: expect.stringContaining('429 rate limit'),
      });

      // Re-call to inspect `cause` precisely.
      mocks.messagesCreate.mockRejectedValueOnce(sdkErr);
      try {
        await generateText({
          system: 's',
          user: 'u',
          maxTokens: 100,
          temperature: 0.5,
        });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ClaudeError);
        expect((err as ClaudeError).cause).toBe(sdkErr);
      }
    });

    it('wraps non-Error throws (string, object) without losing them', async () => {
      mocks.messagesCreate.mockRejectedValue('oops');

      try {
        await generateText({
          system: 's',
          user: 'u',
          maxTokens: 100,
          temperature: 0.5,
        });
        throw new Error('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ClaudeError);
        expect((err as ClaudeError).cause).toBe('oops');
      }
    });
  });

  describe('generateText — missing API key', () => {
    it('throws ClaudeError when ANTHROPIC_API_KEY is unset', async () => {
      restoreEnv();
      restoreEnv = setEnv({ ANTHROPIC_API_KEY: undefined });
      _resetClientForTests();

      await expect(
        generateText({
          system: 's',
          user: 'u',
          maxTokens: 100,
          temperature: 0.5,
        }),
      ).rejects.toMatchObject({
        name: 'ClaudeError',
        message: expect.stringContaining('ANTHROPIC_API_KEY'),
      });

      // SDK constructor should never have been reached.
      expect(mocks.messagesCreate).not.toHaveBeenCalled();
    });
  });
});
