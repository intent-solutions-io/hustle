import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { isE2ETestMode } from '@/lib/e2e';

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

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';
  const cookieOptions = {
    maxAge: 0,
    httpOnly: true,
    secure: isHttps && !isE2ETestMode(),
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookies.set('__session', '', cookieOptions);

  return response;
}
