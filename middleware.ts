/**
 * Next.js Middleware - Edge Protection for Dashboard Routes
 *
 * Runs at the edge (before server components) to check authentication.
 * Provides fast redirects for unauthenticated dashboard access attempts.
 *
 * Phase 3 Task 5 - Middleware for /dashboard Routes
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware handler
 *
 * Checks for Firebase session cookie on dashboard routes.
 * Redirects to /login if cookie not present.
 *
 * IMPORTANT: This is a lightweight check for presence of cookie only.
 * Token verification happens in server components via getDashboardUser().
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('__session');

    // No session cookie → redirect to login
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      // Preserve the attempted URL for redirect after login (future enhancement)
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cookie present → allow request to proceed
    // Server component will verify token validity
  }

  // Allow all other requests
  return NextResponse.next();
}

/**
 * Middleware configuration
 *
 * Matcher patterns specify which routes trigger middleware execution.
 * Uses glob patterns to match all dashboard routes and subroutes.
 */
export const config = {
  matcher: [
    '/dashboard/:path*', // All dashboard routes
  ],
};
