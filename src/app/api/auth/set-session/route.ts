/**
 * Set Session API Route (Firebase Auth)
 *
 * Creates a proper Firebase session cookie (not raw ID token).
 * ID tokens expire in 1 hour; session cookies can last up to 14 days.
 *
 * Note: Uses response.cookies.set() instead of cookies() API
 * for better compatibility with Playwright E2E tests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { ensureUserProvisioned } from '@/lib/firebase/server-provisioning';

export async function POST(request: NextRequest) {
  console.log('[set-session] POST request received');
  const startTime = Date.now();

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('[set-session] Request body parsed, idToken present:', !!body?.idToken);
    } catch (parseError) {
      console.error('[set-session] Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { idToken } = body;

    if (!idToken) {
      console.error('[set-session] No idToken provided');
      return NextResponse.json(
        { success: false, error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    console.log('[set-session] Verifying ID token...');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true);
      console.log('[set-session] Token verified for user:', decodedToken.uid);
      console.log('[set-session] Email:', decodedToken.email, 'Verified:', decodedToken.email_verified);
    } catch (verifyError: any) {
      console.error('[set-session] Token verification failed:', verifyError?.message || verifyError);
      console.error('[set-session] Error code:', verifyError?.code);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token. Please log in again.' },
        { status: 401 }
      );
    }

    // Ensure user has required Firestore documents (user profile + workspace)
    console.log('[set-session] Ensuring user provisioned in Firestore...');
    let provisionResult;
    try {
      provisionResult = await ensureUserProvisioned(decodedToken);
      console.log('[set-session] User provisioned:', provisionResult.userId, 'Workspace:', provisionResult.workspaceId);
    } catch (provisionError: any) {
      console.error('[set-session] User provisioning failed:', provisionError?.message || provisionError);
      // Continue anyway - we'll let the dashboard handle missing data
      // This prevents login failures due to Firestore issues
    }

    // Create a proper Firebase session cookie (NOT raw ID token!)
    // ID tokens expire in 1 hour; session cookies can last up to 14 days
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in MILLISECONDS (required by createSessionCookie)

    console.log('[set-session] Creating Firebase session cookie...');
    let sessionCookie: string;
    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      console.log('[set-session] Session cookie created successfully');
    } catch (cookieError: any) {
      console.error('[set-session] Failed to create session cookie:', cookieError?.message);
      console.error('[set-session] Cookie error code:', cookieError?.code);
      return NextResponse.json(
        { success: false, error: 'Failed to create session. Please try again.' },
        { status: 500 }
      );
    }

    // Create response with user info
    const response = NextResponse.json({
      success: true,
      message: 'Session set successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      },
    });

    // Set cookie on response (single source of truth)
    // Using response.cookies ensures the Set-Cookie header is properly sent
    // IMPORTANT: In production, always use secure=true for HTTPS sites
    // Only allow secure=false for local development (localhost HTTP)
    const isLocalDev = process.env.NODE_ENV !== 'production';
    const isE2ETest = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
    const useSecureCookie = !isLocalDev && !isE2ETest;

    console.log('[set-session] Cookie settings - secure:', useSecureCookie, 'NODE_ENV:', process.env.NODE_ENV, 'E2E:', isE2ETest);

    // Use the proper session cookie (not raw ID token)
    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000, // Convert back to seconds for cookie maxAge
      httpOnly: true,
      secure: useSecureCookie,
      sameSite: 'lax',
      path: '/',
    });

    console.log('[set-session] Session cookie set successfully in', Date.now() - startTime, 'ms');
    return response;
  } catch (error: unknown) {
    const err = error as any;
    console.error('[set-session] UNEXPECTED ERROR:');
    console.error('[set-session] Error type:', typeof error);
    console.error('[set-session] Error message:', err?.message);
    console.error('[set-session] Error code:', err?.code);
    console.error('[set-session] Full error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to set session. Please try again.' },
      { status: 500 }
    );
  }
}
