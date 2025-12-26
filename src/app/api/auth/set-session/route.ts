/**
 * Set Session API Route (Firebase Auth)
 *
 * Sets a secure HTTP-only cookie with the Firebase ID token
 * for server-side authentication verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

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
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days in milliseconds
    const cookieStore = await cookies();

    cookieStore.set('__session', idToken, {
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Session set successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      },
    });
  } catch (error: unknown) {
    console.error('Set session error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to set session' },
      { status: 500 }
    );
  }
}
