/**
 * Firebase Server Session Helpers
 *
 * Centralizes reading + verification of the Firebase session cookie.
 * Used by both API route auth (`src/lib/auth.ts`) and dashboard auth
 * (`src/lib/firebase/admin-auth.ts`) to keep behavior consistent.
 */

import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '@/lib/firebase/admin';

export async function getServerSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return (
    cookieStore.get('__session')?.value ||
    cookieStore.get('firebase-auth-token')?.value ||
    null
  );
}

export async function getServerSessionClaims(options?: {
  checkRevoked?: boolean;
}): Promise<DecodedIdToken | null> {
  const sessionCookie = await getServerSessionCookie();
  if (!sessionCookie) return null;

  try {
    return await adminAuth.verifySessionCookie(
      sessionCookie,
      options?.checkRevoked ?? true
    );
  } catch (error: any) {
    console.warn('[server-session] Invalid session cookie:', error?.message || error);
    return null;
  }
}

export async function requireServerSessionClaims(options?: {
  checkRevoked?: boolean;
}): Promise<DecodedIdToken> {
  const claims = await getServerSessionClaims(options);
  if (!claims) {
    throw new Error('Unauthorized: No valid Firebase session');
  }
  return claims;
}

