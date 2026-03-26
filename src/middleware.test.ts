/**
 * Middleware Tests
 *
 * Verifies edge-level route protection:
 * - Dashboard routes redirect unauthenticated requests to /login
 * - Protected API routes return 401 JSON for unauthenticated requests
 * - Public API routes pass through unconditionally
 * - All other routes pass through
 */

import { NextRequest } from 'next/server';
import { middleware, config } from './middleware';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(path: string, withSession = false): NextRequest {
  const request = new NextRequest(`http://localhost:3000${path}`);
  if (withSession) {
    request.cookies.set('__session', 'valid-session-token');
  }
  return request;
}

function isRedirect(response: Response): boolean {
  return response.status >= 300 && response.status < 400;
}

function isPassThrough(response: Response): boolean {
  // NextResponse.next() sets x-middleware-next header in test/edge environments.
  // In Vitest (jsdom), the header may not be set, but status 200 with no redirect
  // and no JSON body indicates pass-through. We check that it is NOT a redirect
  // and NOT a 401.
  return !isRedirect(response) && response.status !== 401;
}

// ---------------------------------------------------------------------------
// Dashboard routes
// ---------------------------------------------------------------------------

describe('middleware - dashboard routes', () => {
  it('redirects to /login when no session cookie is present', async () => {
    const request = makeRequest('/dashboard');
    const response = await middleware(request);

    expect(isRedirect(response)).toBe(true);
    const location = response.headers.get('location') ?? '';
    expect(location).toContain('/login');
  });

  it('includes ?from= query param pointing to the requested path', async () => {
    const request = makeRequest('/dashboard');
    const response = await middleware(request);

    const location = response.headers.get('location') ?? '';
    expect(location).toContain('from=%2Fdashboard');
  });

  it('allows dashboard access when session cookie is present', async () => {
    const request = makeRequest('/dashboard', true);
    const response = await middleware(request);

    expect(isRedirect(response)).toBe(false);
    expect(response.status).not.toBe(401);
  });

  it('redirects nested /dashboard/players path when no session', async () => {
    const request = makeRequest('/dashboard/players');
    const response = await middleware(request);

    expect(isRedirect(response)).toBe(true);
    const location = response.headers.get('location') ?? '';
    expect(location).toContain('/login');
    expect(location).toContain('from=%2Fdashboard%2Fplayers');
  });

  it('preserves deeply nested path in ?from= param', async () => {
    const request = makeRequest('/dashboard/settings/billing');
    const response = await middleware(request);

    const location = response.headers.get('location') ?? '';
    expect(location).toContain('from=%2Fdashboard%2Fsettings%2Fbilling');
  });

  it('passes through nested dashboard path when session exists', async () => {
    const request = makeRequest('/dashboard/settings/billing', true);
    const response = await middleware(request);

    expect(isRedirect(response)).toBe(false);
    expect(response.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Protected API routes
// ---------------------------------------------------------------------------

describe('middleware - protected API routes', () => {
  it('returns 401 for /api/players with no session', async () => {
    const request = makeRequest('/api/players');
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it('returns UNAUTHORIZED error code in JSON body', async () => {
    const request = makeRequest('/api/players');
    const response = await middleware(request);

    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
    expect(body.message).toBeTruthy();
    expect(body.path).toBe('/api/players');
  });

  it('passes through /api/players when session cookie is present', async () => {
    const request = makeRequest('/api/players', true);
    const response = await middleware(request);

    expect(response.status).not.toBe(401);
    expect(isRedirect(response)).toBe(false);
  });

  it('returns 401 for arbitrary protected API paths with no session', async () => {
    const request = makeRequest('/api/billing/portal');
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it('passes through protected API path when session exists', async () => {
    const request = makeRequest('/api/billing/portal', true);
    const response = await middleware(request);

    expect(response.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Public API routes
// ---------------------------------------------------------------------------

describe('middleware - public API routes', () => {
  const publicRoutes = [
    '/api/health',
    '/api/healthcheck',
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/callback',
    '/api/auth/signout',
    '/api/auth/set-session',
    '/api/auth/resend-verification',
    '/api/waitlist',
    '/api/webhooks',
    '/api/verify',
    '/api/test-post',
  ];

  for (const route of publicRoutes) {
    it(`passes through ${route} without a session`, async () => {
      const request = makeRequest(route);
      const response = await middleware(request);

      expect(response.status).not.toBe(401);
      expect(isRedirect(response)).toBe(false);
    });
  }

  it('passes through /api/webhooks/stripe (startsWith match)', async () => {
    const request = makeRequest('/api/webhooks/stripe');
    const response = await middleware(request);

    expect(response.status).not.toBe(401);
    expect(isRedirect(response)).toBe(false);
  });

  it('passes through /api/auth/resend-verification without session', async () => {
    const request = makeRequest('/api/auth/resend-verification');
    const response = await middleware(request);

    expect(response.status).not.toBe(401);
  });

  it('passes through /api/verify without session', async () => {
    const request = makeRequest('/api/verify');
    const response = await middleware(request);

    expect(response.status).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Non-matched routes
// ---------------------------------------------------------------------------

describe('middleware - non-matched routes', () => {
  it('passes through / (home page)', async () => {
    const request = makeRequest('/');
    const response = await middleware(request);

    expect(isPassThrough(response)).toBe(true);
  });

  it('passes through /about', async () => {
    const request = makeRequest('/about');
    const response = await middleware(request);

    expect(isPassThrough(response)).toBe(true);
  });

  it('passes through /login', async () => {
    const request = makeRequest('/login');
    const response = await middleware(request);

    expect(isPassThrough(response)).toBe(true);
  });

  it('passes through /pricing', async () => {
    const request = makeRequest('/pricing');
    const response = await middleware(request);

    expect(isPassThrough(response)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Config matcher
// ---------------------------------------------------------------------------

describe('middleware config', () => {
  it('exports a matcher array', () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher.length).toBeGreaterThan(0);
  });

  it('matcher includes dashboard routes pattern', () => {
    const patterns = config.matcher as string[];
    const hasDashboard = patterns.some((p) => p.includes('dashboard'));
    expect(hasDashboard).toBe(true);
  });

  it('matcher includes api routes pattern', () => {
    const patterns = config.matcher as string[];
    const hasApi = patterns.some((p) => p.includes('api'));
    expect(hasApi).toBe(true);
  });
});
