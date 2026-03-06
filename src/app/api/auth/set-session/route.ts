/**
 * Set Session API Route (Firebase Auth)
 *
 * Creates a Firebase session cookie (14-day, httpOnly).
 * Called by the login page after Firebase client-side auth succeeds.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { ensureUserProvisioned } from '@/lib/firebase/server-provisioning';
import { isE2ETestMode } from '@/lib/e2e';
import { createLogger } from '@/lib/logger';
import { withTimeout } from '@/lib/utils/timeout';

const logger = createLogger('api/auth/set-session');

// Diagnostic: confirm module loads
console.log('[set-session] module loaded');

const SESSION_EXPIRES_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  console.log(`[set-session] POST handler entered at ${new Date().toISOString()}`);
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
    console.log(`[set-session] body parsed +${Date.now() - t0}ms`);

    const { idToken } = body;
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID token is required' }, { status: 400 });
    }

    // Verify the ID token
    let decodedToken;
    try {
      console.log(`[set-session] calling verifyIdToken +${Date.now() - t0}ms`);
      decodedToken = await withTimeout(adminAuth.verifyIdToken(idToken, true), 25000, 'verifyIdToken');
      console.log(`[set-session] verifyIdToken done +${Date.now() - t0}ms`);
    } catch (verifyError: any) {
      const isTimeout = verifyError?.message?.includes('timed out');
      console.error(`[set-session] verifyIdToken FAILED +${Date.now() - t0}ms: ${verifyError?.message}`);
      logger.error('Token verification failed: ' + (verifyError?.message || ''), verifyError instanceof Error ? verifyError : new Error(String(verifyError)));
      return NextResponse.json(
        { success: false, error: isTimeout ? 'Server timeout verifying token. Please try again.' : 'Invalid or expired token. Please log in again.' },
        { status: isTimeout ? 504 : 401 }
      );
    }

    // Create session cookie
    let sessionCookie: string;
    try {
      console.log(`[set-session] calling createSessionCookie +${Date.now() - t0}ms`);
      sessionCookie = await withTimeout(adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_MS }), 25000, 'createSessionCookie');
      console.log(`[set-session] createSessionCookie done +${Date.now() - t0}ms`);
    } catch (cookieError: any) {
      const isTimeout = cookieError?.message?.includes('timed out');
      console.error(`[set-session] createSessionCookie FAILED +${Date.now() - t0}ms: ${cookieError?.message}`);
      logger.error('Failed to create session cookie: ' + (cookieError?.message || ''), cookieError instanceof Error ? cookieError : new Error(String(cookieError)));
      return NextResponse.json(
        { success: false, error: isTimeout ? 'Server timeout creating session. Please try again.' : 'Failed to create session. Please try again.' },
        { status: isTimeout ? 504 : 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      },
    });

    const isLocalDev = process.env.NODE_ENV !== 'production';
    response.cookies.set('__session', sessionCookie, {
      maxAge: SESSION_EXPIRES_MS / 1000,
      httpOnly: true,
      secure: !isLocalDev && !isE2ETestMode(),
      sameSite: 'lax',
      path: '/',
    });

    // Fire-and-forget: ensure user has Firestore documents (profile + workspace)
    ensureUserProvisioned(decodedToken).catch((err: any) => {
      logger.error('Background provisioning failed: ' + (err?.message || err), err instanceof Error ? err : new Error(String(err)));
    });

    return response;
  } catch (error: unknown) {
    logger.error('Unexpected error: ' + ((error as Error)?.message || ''), error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to set session. Please try again.' },
      { status: 500 }
    );
  }
}
