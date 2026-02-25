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

const logger = createLogger('api/auth/set-session');

const SESSION_EXPIRES_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { idToken } = body;
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID token is required' }, { status: 400 });
    }

    // Verify the ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true);
    } catch (verifyError: any) {
      logger.error('Token verification failed: ' + (verifyError?.message || ''), verifyError instanceof Error ? verifyError : new Error(String(verifyError)));
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      );
    }

    // Create session cookie
    let sessionCookie: string;
    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_MS });
    } catch (cookieError: any) {
      logger.error('Failed to create session cookie: ' + (cookieError?.message || ''), cookieError instanceof Error ? cookieError : new Error(String(cookieError)));
      return NextResponse.json(
        { success: false, error: 'Failed to create session. Please try again.' },
        { status: 500 }
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
