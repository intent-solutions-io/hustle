/**
 * Set Session API Route (Firebase Auth)
 *
 * Sets a secure HTTP-only cookie with the Firebase ID token
 * for server-side authentication verification.
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

    // Create response with cookie set in headers (ensures browser receives it)
    const response = NextResponse.json({
      success: true,
      message: 'Session set successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      },
    });

    // Set cookie on response object to ensure it's in the Set-Cookie header
    response.cookies.set('__session', idToken, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
