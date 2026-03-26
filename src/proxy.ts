import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = '__session';

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/verify-email',
  '/resend-verification',
  '/terms',
  '/privacy',
];

const publicPrefixes = [
  '/api/auth/',
  '/_next/',
  '/favicon',
  '/images/',
  '/videos/',
  '/animations/',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
