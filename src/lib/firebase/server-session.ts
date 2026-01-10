/**
 * Firebase Server Session Helpers
 *
 * Centralizes reading + verification of the Firebase ID token from cookies.
 * Used by both API route auth (`src/lib/auth.ts`) and dashboard auth
 * (`src/lib/firebase/admin-auth.ts`) to keep behavior consistent.
 *
 * Note: We store raw Firebase ID tokens in cookies (not session cookies created
 * via createSessionCookie), so we use verifyIdToken() for verification.
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
  const idToken = await getServerSessionCookie();
  if (!idToken) return null;

  try {
    // Use verifyIdToken since we store raw ID tokens, not Firebase session cookies
    return await adminAuth.verifyIdToken(
      idToken,
      options?.checkRevoked ?? true
    );
  } catch (error: any) {
    console.warn('[server-session] Invalid ID token:', error?.message || error);
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

