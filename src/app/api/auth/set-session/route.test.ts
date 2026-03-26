/**
 * POST /api/auth/set-session Tests
 *
 * Verifies Firebase session cookie creation:
 * - Validates idToken from request body
 * - Calls adminAuth.verifyIdToken then adminAuth.createSessionCookie
 * - Sets __session cookie with correct attributes
 * - Fires ensureUserProvisioned as fire-and-forget
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
  ensureUserProvisioned: vi.fn(),
  isE2ETestMode: vi.fn(() => false),
}));

// ---------------------------------------------------------------------------
// Module mocks (must be at module level, before imports)
// ---------------------------------------------------------------------------

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: mocks.verifyIdToken,
    createSessionCookie: mocks.createSessionCookie,
  },
}));

vi.mock('@/lib/firebase/server-provisioning', () => ({
  ensureUserProvisioned: mocks.ensureUserProvisioned,
}));

vi.mock('@/lib/e2e', () => ({
  isE2ETestMode: mocks.isE2ETestMode,
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { POST } from './route';
import { createMockRequest } from '@/test-utils';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const MOCK_DECODED_TOKEN = {
  uid: 'user-abc',
  email: 'player@example.com',
  email_verified: true,
};

const MOCK_SESSION_COOKIE = 'mock-firebase-session-cookie-value';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/set-session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyIdToken.mockResolvedValue(MOCK_DECODED_TOKEN);
    mocks.createSessionCookie.mockResolvedValue(MOCK_SESSION_COOKIE);
    mocks.ensureUserProvisioned.mockResolvedValue(undefined);
    mocks.isE2ETestMode.mockReturnValue(false);
  });

  // -------------------------------------------------------------------------
  // Request validation
  // -------------------------------------------------------------------------

  it('returns 400 when request body is not valid JSON', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'text/plain' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    // Override json() to throw so the inner try/catch fires
    vi.spyOn(request, 'json').mockRejectedValue(new SyntaxError('Unexpected token'));

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns 400 when idToken is missing from body', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {},
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/token/i);
  });

  it('returns 400 when idToken is an empty string', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { idToken: '' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  // -------------------------------------------------------------------------
  // Token verification failures
  // -------------------------------------------------------------------------

  it('returns 401 when verifyIdToken throws (invalid token)', async () => {
    mocks.verifyIdToken.mockRejectedValue(new Error('ID token has expired'));

    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'expired-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns 401 when verifyIdToken throws with revoked token error', async () => {
    mocks.verifyIdToken.mockRejectedValue(new Error('Firebase ID token has been revoked'));

    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'revoked-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  // -------------------------------------------------------------------------
  // Session cookie creation failures
  // -------------------------------------------------------------------------

  it('returns 500 when createSessionCookie throws', async () => {
    mocks.createSessionCookie.mockRejectedValue(new Error('Failed to create session cookie'));

    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'valid-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it('returns 200 with success and user info on valid token', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'valid-firebase-id-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user).toEqual({
      uid: 'user-abc',
      email: 'player@example.com',
      emailVerified: true,
    });
  });

  it('calls verifyIdToken with the provided token and checkRevoked=true', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'my-id-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    await POST(request);

    expect(mocks.verifyIdToken).toHaveBeenCalledWith('my-id-token', true);
  });

  it('calls createSessionCookie with idToken and 14-day expiry', async () => {
    const FOURTEEN_DAYS_MS = 60 * 60 * 24 * 14 * 1000;

    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'my-id-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    await POST(request);

    expect(mocks.createSessionCookie).toHaveBeenCalledWith('my-id-token', {
      expiresIn: FOURTEEN_DAYS_MS,
    });
  });

  // -------------------------------------------------------------------------
  // Cookie attributes
  // -------------------------------------------------------------------------

  it('sets __session cookie on the response', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'valid-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('__session');
  });

  it('sets cookie with httpOnly attribute', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'valid-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie.toLowerCase()).toContain('httponly');
  });

  it('sets cookie with SameSite=Lax attribute', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'valid-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie.toLowerCase()).toContain('samesite=lax');
  });

  it('sets cookie with Path=/ attribute', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'valid-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    const response = await POST(request);

    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('Path=/');
  });

  // -------------------------------------------------------------------------
  // E2E mode / Secure flag
  // -------------------------------------------------------------------------

  it('does not set Secure flag in E2E test mode (production env)', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    mocks.isE2ETestMode.mockReturnValue(true);

    try {
      const request = createMockRequest({
        method: 'POST',
        body: { idToken: 'valid-token' },
        url: 'http://localhost:3000/api/auth/set-session',
      });

      const response = await POST(request);

      const setCookie = response.headers.get('set-cookie') ?? '';
      // In production + E2E mode, Secure should be omitted
      expect(setCookie).toContain('__session');
      expect(setCookie).not.toContain('Secure');
      expect(mocks.isE2ETestMode).toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = origNodeEnv;
    }
  });

  // -------------------------------------------------------------------------
  // Fire-and-forget provisioning
  // -------------------------------------------------------------------------

  it('calls ensureUserProvisioned with the decoded token', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'valid-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    await POST(request);

    expect(mocks.ensureUserProvisioned).toHaveBeenCalledWith(MOCK_DECODED_TOKEN);
  });

  it('does not fail the response when ensureUserProvisioned rejects', async () => {
    mocks.ensureUserProvisioned.mockRejectedValue(new Error('Provisioning failed'));

    const request = createMockRequest({
      method: 'POST',
      body: { idToken: 'valid-token' },
      url: 'http://localhost:3000/api/auth/set-session',
    });

    // Fire-and-forget: the route should still return 200
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
