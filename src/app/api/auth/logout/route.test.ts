/**
 * POST /api/auth/logout Tests
 *
 * Verifies session revocation and cookie clearing:
 * - Gracefully handles missing session cookie
 * - Verifies session cookie and revokes refresh tokens for valid sessions
 * - Clears __session cookie (maxAge=0) in all cases
 * - Returns { success: true } regardless of session state
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock variables
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  verifySessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
  isE2ETestMode: vi.fn(() => false),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: mocks.verifySessionCookie,
    revokeRefreshTokens: mocks.revokeRefreshTokens,
  },
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
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifySessionCookie.mockResolvedValue({ uid: 'user-abc' });
    mocks.revokeRefreshTokens.mockResolvedValue(undefined);
    mocks.isE2ETestMode.mockReturnValue(false);
  });

  // -------------------------------------------------------------------------
  // No session cookie present
  // -------------------------------------------------------------------------

  it('returns success when no session cookie is present', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/logout',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('does not call verifySessionCookie when no cookie is present', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/logout',
    });

    await POST(request);

    expect(mocks.verifySessionCookie).not.toHaveBeenCalled();
  });

  it('still clears the cookie when no session is present', async () => {
    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/auth/logout',
    });

    const response = await POST(request);

    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('__session');
    expect(setCookie).toContain('Max-Age=0');
  });

  // -------------------------------------------------------------------------
  // Valid session cookie
  // -------------------------------------------------------------------------

  it('returns success for a valid session cookie', async () => {
    const request = createMockRequest({
      method: 'POST',
      cookies: { __session: 'valid-session-cookie' },
      url: 'http://localhost:3000/api/auth/logout',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('verifies session cookie with checkRevoked=true', async () => {
    const request = createMockRequest({
      method: 'POST',
      cookies: { __session: 'valid-session-cookie' },
      url: 'http://localhost:3000/api/auth/logout',
    });

    await POST(request);

    expect(mocks.verifySessionCookie).toHaveBeenCalledWith('valid-session-cookie', true);
  });

  it('revokes refresh tokens for the decoded user uid', async () => {
    mocks.verifySessionCookie.mockResolvedValue({ uid: 'user-xyz' });

    const request = createMockRequest({
      method: 'POST',
      cookies: { __session: 'valid-session-cookie' },
      url: 'http://localhost:3000/api/auth/logout',
    });

    await POST(request);

    expect(mocks.revokeRefreshTokens).toHaveBeenCalledWith('user-xyz');
  });

  it('clears __session cookie after successful logout', async () => {
    const request = createMockRequest({
      method: 'POST',
      cookies: { __session: 'valid-session-cookie' },
      url: 'http://localhost:3000/api/auth/logout',
    });

    const response = await POST(request);

    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('__session');
    expect(setCookie).toContain('Max-Age=0');
  });

  // -------------------------------------------------------------------------
  // Graceful failure when verifySessionCookie throws
  // -------------------------------------------------------------------------

  it('returns success even when verifySessionCookie throws', async () => {
    mocks.verifySessionCookie.mockRejectedValue(new Error('Session cookie has expired'));

    const request = createMockRequest({
      method: 'POST',
      cookies: { __session: 'expired-cookie' },
      url: 'http://localhost:3000/api/auth/logout',
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('still clears cookie when verifySessionCookie throws', async () => {
    mocks.verifySessionCookie.mockRejectedValue(new Error('Session revoked'));

    const request = createMockRequest({
      method: 'POST',
      cookies: { __session: 'bad-cookie' },
      url: 'http://localhost:3000/api/auth/logout',
    });

    const response = await POST(request);

    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('__session');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('does not revoke tokens when cookie verification fails', async () => {
    mocks.verifySessionCookie.mockRejectedValue(new Error('Invalid cookie'));

    const request = createMockRequest({
      method: 'POST',
      cookies: { __session: 'bad-cookie' },
      url: 'http://localhost:3000/api/auth/logout',
    });

    await POST(request);

    expect(mocks.revokeRefreshTokens).not.toHaveBeenCalled();
  });
});
