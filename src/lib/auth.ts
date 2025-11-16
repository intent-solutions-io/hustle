/**
 * Server-Side Authentication (Firebase Auth)
 *
 * Replaces NextAuth session validation with Firebase Auth ID token verification.
 * Used in API routes for server-side authentication.
 *
 * Migration Note: This file replaces the NextAuth configuration that was
 * archived to 99-Archive/20251115-nextauth-legacy/auth.ts
 */

import { cookies } from 'next/headers';
import { adminAuth } from './firebase/admin';

export interface Session {
  user: {
    id: string;
    email: string | null;
    emailVerified: boolean;
  };
}

/**
 * Get authenticated session from Firebase Auth ID token
 *
 * Validates Firebase ID token from cookie and returns session object.
 * Compatible with NextAuth session structure for minimal migration changes.
 *
 * Usage in API routes:
 * ```typescript
 * const session = await auth();
 * if (!session?.user?.id) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 *
 * @returns Session object with user info, or null if not authenticated
 */
export async function auth(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();

    // Get Firebase ID token from cookie (set by client-side Firebase Auth)
    const idToken = cookieStore.get('__session')?.value;

    if (!idToken) {
      return null;
    }

    // Verify ID token with Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      user: {
        id: decodedToken.uid,
        email: decodedToken.email || null,
        emailVerified: decodedToken.email_verified || false,
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
