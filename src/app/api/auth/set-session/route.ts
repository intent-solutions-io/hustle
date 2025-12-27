/**
 * Set Session API Route (Firebase Auth)
 *
 * Sets a secure HTTP-only cookie with the Firebase ID token
 * for server-side authentication verification.
 *
 * Note: Uses response.cookies.set() instead of cookies() API
 * for better compatibility with Playwright E2E tests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);

    // Set session cookie (14 days expiry)
    const expiresIn = 60 * 60 * 24 * 14; // 14 days in seconds

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
    // Note: secure=false in E2E tests (localhost HTTP), true in production (HTTPS)
    const isE2ETest = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
    response.cookies.set('__session', idToken, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && !isE2ETest,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Set session error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to set session' },
      { status: 500 }
    );
  }
}
