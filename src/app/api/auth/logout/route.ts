import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      await adminAuth.revokeRefreshTokens(decoded.uid);
    } catch (error) {
      console.warn('[api/auth/logout] Failed to revoke session:', error);
    }
  }

  const response = NextResponse.json({ success: true });

  const isE2ETest = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';
  const cookieOptions = {
    maxAge: 0,
    httpOnly: true,
    secure: isHttps && !isE2ETest,
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookies.set('__session', '', cookieOptions);
  response.cookies.set('firebase-auth-token', '', cookieOptions);

  return response;
}
