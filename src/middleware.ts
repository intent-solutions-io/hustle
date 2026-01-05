/**
 * Unified Middleware - Edge Protection & Session Validation
 *
 * Handles both:
 * 1. Dashboard route protection (redirects to /login if no session)
 * 2. API route protection (returns 401 if no session)
 *
 * IMPORTANT: This file MUST be in src/ when using src/app/ structure.
 * Next.js ignores root middleware.ts when src/ directory exists.
 *
 * Logging Levels (controlled by MIDDLEWARE_DEBUG env var):
 * - 'verbose': All requests logged with full details
 * - 'errors': Only auth failures logged
 * - undefined: Minimal logging (CI default)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Structured logging for observability
interface MiddlewareLog {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  path: string;
  action: string;
  details?: Record<string, unknown>;
}

function log(entry: Omit<MiddlewareLog, 'timestamp'>) {
  const debugLevel = process.env.MIDDLEWARE_DEBUG;
  const shouldLog =
    debugLevel === 'verbose' ||
    (debugLevel === 'errors' && (entry.level === 'WARN' || entry.level === 'ERROR')) ||
    entry.level === 'ERROR'; // Always log errors

  if (shouldLog) {
    const timestamp = new Date().toISOString();
    const prefix = `[MIDDLEWARE:${entry.level}]`;
    console.log(`${prefix} [${timestamp}] ${entry.path} - ${entry.action}`, entry.details ? JSON.stringify(entry.details) : '');
  }
}

/**
 * Public routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  '/api/health',
  '/api/healthcheck',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/callback',
  '/api/auth/signout',
  '/api/auth/set-session',
  '/api/auth/forgot-password',
  '/api/auth/resend-verification',
  '/api/waitlist',
  '/api/webhooks',
  '/api/verify',
];

/**
 * Check if path matches any public routes
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Get session cookie from request
 */
function getSessionCookie(request: NextRequest): string | null {
  const sessionCookie =
    request.cookies.get('__session')?.value ||
    request.cookies.get('firebase-auth-token')?.value;
  return sessionCookie || null;
}

/**
 * Middleware handler
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  const hasSession = !!sessionCookie;

  // Log all requests in verbose mode
  log({
    level: 'DEBUG',
    path: pathname,
    action: 'REQUEST_START',
    details: {
      method: request.method,
      hasSession,
      cookies: Array.from(request.cookies.getAll()).map((c) => c.name),
    },
  });

  // ============================================
  // DASHBOARD ROUTES: Redirect to /login if no session
  // ============================================
  if (pathname.startsWith('/dashboard')) {
    if (!hasSession) {
      log({
        level: 'INFO',
        path: pathname,
        action: 'REDIRECT_TO_LOGIN',
        details: { reason: 'no_session_cookie' },
      });

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    log({
      level: 'DEBUG',
      path: pathname,
      action: 'DASHBOARD_ACCESS_ALLOWED',
      details: { hasSession: true },
    });

    return NextResponse.next();
  }

  // ============================================
  // API ROUTES: Return 401 if no session (except public routes)
  // ============================================
  if (pathname.startsWith('/api/')) {
    // Public API routes - skip validation
    if (isPublicApiRoute(pathname)) {
      log({
        level: 'DEBUG',
        path: pathname,
        action: 'PUBLIC_API_ALLOWED',
      });
      return NextResponse.next();
    }

    // Protected API routes - require session
    if (!hasSession) {
      log({
        level: 'WARN',
        path: pathname,
        action: 'API_UNAUTHORIZED',
        details: { reason: 'no_session_cookie' },
      });

      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Authentication required. Please sign in.',
          path: pathname,
        },
        { status: 401 }
      );
    }

    log({
      level: 'DEBUG',
      path: pathname,
      action: 'API_ACCESS_ALLOWED',
    });

    return NextResponse.next();
  }

  // ============================================
  // ALL OTHER ROUTES: Pass through
  // ============================================
  return NextResponse.next();
}

/**
 * Middleware configuration
 *
 * Match dashboard and API routes for protection.
 * NOTE: We exclude /api/:path* from middleware to avoid body consumption issues
 * in Next.js 15 + Turbopack. API routes handle their own auth via auth() function.
 */
export const config = {
  matcher: [
    // Dashboard routes - redirect to login
    '/dashboard/:path*',
    // API routes are now handled directly in route handlers to avoid body stream issues
    // '/api/:path*',
  ],
};
