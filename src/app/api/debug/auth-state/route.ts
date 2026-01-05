/**
 * Auth State Debug Endpoint
 *
 * Returns detailed authentication state for debugging.
 * ONLY available in development or E2E test mode.
 *
 * GET /api/debug/auth-state
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Only allow in dev/test mode
  const isDevOrTest =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  if (!isDevOrTest) {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();

    // Collect all cookie names (not values for security)
    const allCookies = cookieStore.getAll().map((c) => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0,
    }));

    // Check specific auth cookies
    const sessionCookie = cookieStore.get('__session');
    const firebaseToken = cookieStore.get('firebase-auth-token');

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        E2E_TEST_MODE: process.env.NEXT_PUBLIC_E2E_TEST_MODE,
        MIDDLEWARE_DEBUG: process.env.MIDDLEWARE_DEBUG,
      },
      cookies: {
        total: allCookies.length,
        list: allCookies,
      },
      authState: {
        hasSessionCookie: !!sessionCookie,
        sessionCookieLength: sessionCookie?.value?.length || 0,
        hasFirebaseToken: !!firebaseToken,
        firebaseTokenLength: firebaseToken?.value?.length || 0,
      },
      headers: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        'user-agent': request.headers.get('user-agent')?.slice(0, 100),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      {
        error: 'Failed to get auth state',
        message: err.message,
      },
      { status: 500 }
    );
  }
}
