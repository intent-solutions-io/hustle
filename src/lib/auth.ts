/**
 * Server-Side Authentication (Firebase Auth)
 *
 * Validates Firebase session cookies for server-side authentication.
 * Used in API routes.
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
 * Get authenticated session from Firebase session cookie
 *
 * Validates Firebase session cookie and returns session object.
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

    // Get Firebase session cookie (created by set-session API route)
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify session cookie with Firebase Admin SDK (not ID token!)
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);

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
