import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

const COOKIE_NAME = '__session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days in seconds

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Create a Firebase session cookie (14 days)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: COOKIE_MAX_AGE * 1000, // milliseconds
    });

    const response = NextResponse.json({
      success: true,
      uid: decodedToken.uid,
    });

    response.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Set session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    );
  }
}
