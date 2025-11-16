/**
 * Firebase Admin Authentication Utilities
 *
 * Server-side auth helpers for verifying Firebase ID tokens
 * and fetching authenticated user data.
 */

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './admin';
import type { User } from '@/types/firestore';

/**
 * Dashboard user type (matches Header component interface)
 */
export interface DashboardUser {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
}

/**
 * Get authenticated user for dashboard pages
 *
 * Verifies Firebase ID token from cookies and fetches user data from Firestore.
 * Returns null if not authenticated.
 *
 * @returns DashboardUser or null
 */
export async function getDashboardUser(): Promise<DashboardUser | null> {
  try {
    // Get Firebase ID token from cookies
    // Firebase client SDK stores the token as __session or firebase-auth-token
    const cookieStore = await cookies();

    // Try multiple cookie names (Firebase uses different names in different scenarios)
    const sessionCookie = cookieStore.get('__session')?.value ||
                         cookieStore.get('firebase-auth-token')?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie, true);

    // Fetch user data from Firestore
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      console.error(`User document not found for UID: ${decodedToken.uid}`);
      return null;
    }

    const userData = userDoc.data() as User;

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      firstName: userData.firstName,
      lastName: userData.lastName,
      emailVerified: decodedToken.email_verified || false,
    };
  } catch (error: any) {
    console.error('Error getting dashboard user:', error.message);
    return null;
  }
}

/**
 * Require authentication for dashboard pages
 *
 * Call this in dashboard layouts/pages to enforce authentication.
 * Throws an error if not authenticated (Next.js will redirect to error page).
 *
 * @returns DashboardUser (guaranteed non-null)
 * @throws Error if not authenticated
 */
export async function requireDashboardAuth(): Promise<DashboardUser> {
  const user = await getDashboardUser();

  if (!user) {
    throw new Error('Unauthorized: No valid Firebase session');
  }

  if (!user.emailVerified) {
    throw new Error('Unauthorized: Email not verified');
  }

  return user;
}

/**
 * Check if user is authenticated (boolean check)
 *
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getDashboardUser();
  return user !== null && user.emailVerified;
}
