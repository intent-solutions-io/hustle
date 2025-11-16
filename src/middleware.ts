/**
 * Global Access Enforcement Middleware
 *
 * Phase 7: Session Validation Gatekeeper
 *
 * Runs on authenticated API routes to validate Firebase session cookies.
 * Actual workspace subscription enforcement happens in API routes via
 * checkWorkspaceAccess() utility (see: src/lib/firebase/access-control.ts).
 *
 * Why Not Full Enforcement Here?
 * - Next.js middleware runs on Edge runtime (no Node.js APIs)
 * - Firebase Admin SDK requires Node.js runtime
 * - Workspace status checks need Firestore access (Admin SDK)
 *
 * Solution:
 * - Middleware validates session exists
 * - API routes call requireWorkspaceWriteAccess() before mutations
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware: Session validation
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request;

  // Public routes - skip validation
  const publicRoutes = [
    '/api/health',
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/callback',
    '/api/auth/signout',
  ];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected API routes - require session cookie
  if (pathname.startsWith('/api/')) {
    const sessionCookie =
      request.cookies.get('__session')?.value ||
      request.cookies.get('firebase-auth-token')?.value;

    if (!sessionCookie) {
      console.warn(`[MIDDLEWARE] Unauthorized access attempt: ${pathname}`);
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Authentication required. Please sign in.',
        },
        { status: 401 }
      );
    }

    // Session exists - allow request to proceed
    // Workspace access enforcement happens in API route via checkWorkspaceAccess()
    return NextResponse.next();
  }

  // Non-API routes - allow through
  return NextResponse.next();
}

/**
 * Middleware configuration
 *
 * Run on all API routes except public auth endpoints
 */
export const config = {
  matcher: [
    // All API routes
    '/api/:path*',
  ],
};
