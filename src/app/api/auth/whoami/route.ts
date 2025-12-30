/**
 * Who Am I API Route
 *
 * Returns current session information for debugging login issues.
 * Useful for support to quickly diagnose authentication problems.
 *
 * GET /api/auth/whoami
 *
 * Returns:
 * - authenticated: boolean
 * - uid: string | null
 * - email: string | null
 * - emailVerified: boolean | null
 * - cookiePresent: boolean
 * - sessionValid: boolean
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check for session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const cookiePresent = !!sessionCookie;

    // If no cookie, return unauthenticated state
    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        uid: null,
        email: null,
        emailVerified: null,
        cookiePresent: false,
        sessionValid: false,
        debug: {
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        },
      });
    }

    // Try to verify the session cookie
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

      return NextResponse.json({
        authenticated: true,
        uid: decodedClaims.uid,
        email: decodedClaims.email || null,
        emailVerified: decodedClaims.email_verified || false,
        cookiePresent: true,
        sessionValid: true,
        claims: {
          aud: decodedClaims.aud,
          iss: decodedClaims.iss,
          exp: decodedClaims.exp,
          iat: decodedClaims.iat,
          auth_time: decodedClaims.auth_time,
        },
        debug: {
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          expiresAt: new Date(decodedClaims.exp * 1000).toISOString(),
        },
      });
    } catch (verifyError: unknown) {
      // Cookie present but invalid/expired
      const error = verifyError as { code?: string; message?: string };
      return NextResponse.json({
        authenticated: false,
        uid: null,
        email: null,
        emailVerified: null,
        cookiePresent: true,
        sessionValid: false,
        error: {
          code: error?.code || 'unknown',
          message: error?.message || 'Session verification failed',
        },
        debug: {
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        },
      });
    }
  } catch (error: unknown) {
    console.error('[whoami] Unexpected error:', error);
    const err = error as { message?: string };
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Internal server error',
        message: err?.message || 'Unknown error',
        debug: {
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}
