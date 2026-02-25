/**
 * POST /api/auth/resend-verification Tests
 *
 * Verifies the email verification resend flow:
 * - Validates email format before any Firebase calls
 * - Fails fast when email service is not configured
 * - Returns success (without leaking user existence) for unknown users
 * - Returns success for already-verified users
 * - Sends a branded verification email for unverified users
 * - Returns success regardless for unknown user errors (anti-enumeration)
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  generateEmailVerificationLink: vi.fn(),
  firestoreGet: vi.fn(),
  sendEmail: vi.fn(),
  emailVerificationTemplate: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    getUserByEmail: mocks.getUserByEmail,
    generateEmailVerificationLink: mocks.generateEmailVerificationLink,
  },
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: mocks.firestoreGet,
      })),
    })),
  },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock('@/lib/email-templates', () => ({
  emailTemplates: {
    emailVerification: mocks.emailVerificationTemplate,
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { POST } from './route';
import { createMockRequest } from '@/test-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>, url = 'http://localhost:3000/api/auth/resend-verification') {
  return createMockRequest({ method: 'POST', body, url });
}

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

const EMAIL_ENV = {
  RESEND_API_KEY: 're_test_key',
  EMAIL_FROM: 'noreply@hustlestats.io',
};

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('POST /api/auth/resend-verification — validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when email is missing', async () => {
    const req = makeRequest({});
    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/valid email/i);
  });

  it('returns 400 when email is not a valid address', async () => {
    const req = makeRequest({ email: 'not-an-email' });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns 400 when email is an empty string', async () => {
    const req = makeRequest({ email: '' });
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('does not call Firebase when the email is invalid', async () => {
    const req = makeRequest({ email: 'bad' });
    await POST(req);

    expect(mocks.getUserByEmail).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Email service not configured
// ---------------------------------------------------------------------------

describe('POST /api/auth/resend-verification — email service unconfigured', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when RESEND_API_KEY is not set', async () => {
    const restore = setEnv({ RESEND_API_KEY: undefined, EMAIL_FROM: 'noreply@hustlestats.io' });

    const req = makeRequest({ email: 'user@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.success).toBe(false);

    restore();
  });

  it('returns 503 when EMAIL_FROM is not set', async () => {
    const restore = setEnv({ RESEND_API_KEY: 're_key', EMAIL_FROM: undefined });

    const req = makeRequest({ email: 'user@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(503);

    restore();
  });

  it('does not call Firebase when email service is unconfigured', async () => {
    const restore = setEnv({ RESEND_API_KEY: undefined, EMAIL_FROM: undefined });

    const req = makeRequest({ email: 'user@example.com' });
    await POST(req);

    expect(mocks.getUserByEmail).not.toHaveBeenCalled();

    restore();
  });
});

// ---------------------------------------------------------------------------
// Unknown user (anti-enumeration)
// ---------------------------------------------------------------------------

describe('POST /api/auth/resend-verification — unknown user', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv(EMAIL_ENV);
  });

  afterEach(() => {
    restore();
  });

  it('returns 200 with success for auth/user-not-found', async () => {
    const err = Object.assign(new Error('No user'), { code: 'auth/user-not-found' });
    mocks.getUserByEmail.mockRejectedValue(err);

    const req = makeRequest({ email: 'ghost@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/verification link has been sent/i);
  });

  it('does not send an email for an unknown user', async () => {
    const err = Object.assign(new Error('No user'), { code: 'auth/user-not-found' });
    mocks.getUserByEmail.mockRejectedValue(err);

    const req = makeRequest({ email: 'ghost@example.com' });
    await POST(req);

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Already-verified user
// ---------------------------------------------------------------------------

describe('POST /api/auth/resend-verification — already-verified user', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv(EMAIL_ENV);
    mocks.getUserByEmail.mockResolvedValue({
      uid: 'user-123',
      emailVerified: true,
    });
  });

  afterEach(() => {
    restore();
  });

  it('returns 200 with success message', async () => {
    const req = makeRequest({ email: 'verified@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('does not send a verification email for an already-verified user', async () => {
    const req = makeRequest({ email: 'verified@example.com' });
    await POST(req);

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('does not generate a new verification link for an already-verified user', async () => {
    const req = makeRequest({ email: 'verified@example.com' });
    await POST(req);

    expect(mocks.generateEmailVerificationLink).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Unverified user — sends verification email
// ---------------------------------------------------------------------------

describe('POST /api/auth/resend-verification — unverified user', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv({
      ...EMAIL_ENV,
      WEBSITE_URL: 'https://hustlestats.io',
    });

    mocks.getUserByEmail.mockResolvedValue({
      uid: 'user-456',
      emailVerified: false,
      displayName: 'Jamie Rivera',
    });

    mocks.generateEmailVerificationLink.mockResolvedValue(
      'https://hustleapp-production.firebaseapp.com/__/auth/action?oobCode=abc123&mode=verifyEmail'
    );

    mocks.firestoreGet.mockResolvedValue({
      exists: true,
      data: () => ({ firstName: 'Jamie' }),
    });

    mocks.emailVerificationTemplate.mockReturnValue({
      subject: 'Verify your email',
      html: '<p>Click here</p>',
      text: 'Click here',
    });

    mocks.sendEmail.mockResolvedValue({ success: true, data: { id: 'email-123' } });
  });

  afterEach(() => {
    restore();
  });

  it('returns 200 with success message when email is sent', async () => {
    const req = makeRequest({ email: 'unverified@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/verification link has been sent/i);
  });

  it('sends the email to the correct address', async () => {
    const req = makeRequest({ email: 'unverified@example.com' });
    await POST(req);

    const sendArg = mocks.sendEmail.mock.calls[0][0];
    expect(sendArg.to).toBe('unverified@example.com');
  });

  it('generates a Firebase verification link for the email', async () => {
    const req = makeRequest({ email: 'unverified@example.com' });
    await POST(req);

    expect(mocks.generateEmailVerificationLink).toHaveBeenCalledWith('unverified@example.com');
  });

  it('constructs a branded verification URL using WEBSITE_URL and oobCode', async () => {
    const req = makeRequest({ email: 'unverified@example.com' });
    await POST(req);

    const templateArg = mocks.emailVerificationTemplate.mock.calls[0];
    const verificationUrl: string = templateArg[1];
    expect(verificationUrl).toContain('hustlestats.io/verify-email');
    expect(verificationUrl).toContain('oobCode=');
  });

  it('uses firstName from Firestore user document', async () => {
    const req = makeRequest({ email: 'unverified@example.com' });
    await POST(req);

    const firstName: string = mocks.emailVerificationTemplate.mock.calls[0][0];
    expect(firstName).toBe('Jamie');
  });

  it('falls back to displayName split when Firestore doc is absent', async () => {
    mocks.firestoreGet.mockResolvedValue({ exists: false, data: () => null });
    mocks.getUserByEmail.mockResolvedValue({
      uid: 'user-789',
      emailVerified: false,
      displayName: 'Pat Smith',
    });

    const req = makeRequest({ email: 'unverified@example.com' });
    await POST(req);

    const firstName: string = mocks.emailVerificationTemplate.mock.calls[0][0];
    expect(firstName).toBe('Pat');
  });

  it('falls back to "there" when no name information is available', async () => {
    mocks.firestoreGet.mockResolvedValue({ exists: false, data: () => null });
    mocks.getUserByEmail.mockResolvedValue({
      uid: 'user-000',
      emailVerified: false,
      displayName: null,
    });

    const req = makeRequest({ email: 'anon@example.com' });
    await POST(req);

    const firstName: string = mocks.emailVerificationTemplate.mock.calls[0][0];
    expect(firstName).toBe('there');
  });

  it('returns 500 when sendEmail fails', async () => {
    mocks.sendEmail.mockResolvedValue({ success: false, error: 'SMTP error' });

    const req = makeRequest({ email: 'unverified@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unexpected Firebase errors
// ---------------------------------------------------------------------------

describe('POST /api/auth/resend-verification — unexpected errors', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv(EMAIL_ENV);
  });

  afterEach(() => {
    restore();
  });

  it('returns 500 for unexpected Firebase errors', async () => {
    mocks.getUserByEmail.mockRejectedValue(new Error('Firebase internal error'));

    const req = makeRequest({ email: 'user@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
