/**
 * Email Service Tests
 *
 * Tests for sendEmail() in src/lib/email.ts.
 * Verifies configuration guards, Resend integration, and error handling.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  emailsSend: vi.fn(),
}));

// Mock the Resend class before any imports
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mocks.emailsSend,
    },
  })),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { sendEmail } from './email';
import type { EmailOptions } from './email';

// ---------------------------------------------------------------------------
// Helpers for environment variable management
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const validOptions: EmailOptions = {
  to: 'recipient@example.com',
  subject: 'Test Subject',
  html: '<p>Hello <strong>world</strong></p>',
  text: 'Hello world',
};

// ---------------------------------------------------------------------------
// Missing environment variables — early-exit paths
// ---------------------------------------------------------------------------

describe('sendEmail() — configuration guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns failure when RESEND_API_KEY is not set', async () => {
    const restore = setEnv({ RESEND_API_KEY: undefined, EMAIL_FROM: 'noreply@example.com' });

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not configured/i);

    restore();
  });

  it('returns failure when EMAIL_FROM is not set', async () => {
    const restore = setEnv({ RESEND_API_KEY: 're_test_key', EMAIL_FROM: undefined });

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not configured/i);

    restore();
  });

  it('does not call Resend when RESEND_API_KEY is missing', async () => {
    const restore = setEnv({ RESEND_API_KEY: undefined, EMAIL_FROM: 'noreply@example.com' });

    await sendEmail(validOptions);

    expect(mocks.emailsSend).not.toHaveBeenCalled();

    restore();
  });

  it('does not call Resend when EMAIL_FROM is missing', async () => {
    const restore = setEnv({ RESEND_API_KEY: 're_test_key', EMAIL_FROM: undefined });

    await sendEmail(validOptions);

    expect(mocks.emailsSend).not.toHaveBeenCalled();

    restore();
  });
});

// ---------------------------------------------------------------------------
// Successful send
// ---------------------------------------------------------------------------

describe('sendEmail() — successful delivery', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv({ RESEND_API_KEY: 're_test_key', EMAIL_FROM: 'noreply@hustlestats.io' });
    mocks.emailsSend.mockResolvedValue({ data: { id: 'email-id-123' }, error: null });
  });

  afterEach(() => {
    restore();
  });

  it('returns success with data when Resend accepts the email', async () => {
    const result = await sendEmail(validOptions);

    expect(result.success).toBe(true);
    expect((result as any).data).toEqual({ id: 'email-id-123' });
  });

  it('passes the correct payload to Resend emails.send()', async () => {
    await sendEmail(validOptions);

    expect(mocks.emailsSend).toHaveBeenCalledOnce();
    const callArg = mocks.emailsSend.mock.calls[0][0];
    expect(callArg.from).toBe('noreply@hustlestats.io');
    expect(callArg.to).toBe('recipient@example.com');
    expect(callArg.subject).toBe('Test Subject');
    expect(callArg.html).toBe('<p>Hello <strong>world</strong></p>');
    expect(callArg.text).toBe('Hello world');
  });

  it('strips HTML tags to generate plain text when text is not provided', async () => {
    await sendEmail({
      to: 'x@example.com',
      subject: 'No text',
      html: '<p>Hello <strong>world</strong></p>',
    });

    const callArg = mocks.emailsSend.mock.calls[0][0];
    expect(callArg.text).toBe('Hello world');
  });

  it('uses provided text over the HTML-stripped fallback', async () => {
    await sendEmail({
      ...validOptions,
      text: 'Explicit plain text',
    });

    const callArg = mocks.emailsSend.mock.calls[0][0];
    expect(callArg.text).toBe('Explicit plain text');
  });
});

// ---------------------------------------------------------------------------
// Resend returns an error object
// ---------------------------------------------------------------------------

describe('sendEmail() — Resend error response', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv({ RESEND_API_KEY: 're_test_key', EMAIL_FROM: 'noreply@hustlestats.io' });
  });

  afterEach(() => {
    restore();
  });

  it('returns failure when Resend returns an error in the response', async () => {
    mocks.emailsSend.mockResolvedValue({
      data: null,
      error: { message: 'Invalid to address' },
    });

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid to address');
  });
});

// ---------------------------------------------------------------------------
// Resend throws an exception
// ---------------------------------------------------------------------------

describe('sendEmail() — thrown exceptions', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv({ RESEND_API_KEY: 're_test_key', EMAIL_FROM: 'noreply@hustlestats.io' });
  });

  afterEach(() => {
    restore();
  });

  it('returns failure when Resend throws an Error instance', async () => {
    mocks.emailsSend.mockRejectedValue(new Error('network failure'));

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBe('network failure');
  });

  it('returns "Unknown error" when a non-Error value is thrown', async () => {
    mocks.emailsSend.mockRejectedValue('some string error');

    const result = await sendEmail(validOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });

  it('does not throw — always resolves', async () => {
    mocks.emailsSend.mockRejectedValue(new Error('fatal'));

    await expect(sendEmail(validOptions)).resolves.toBeDefined();
  });
});
