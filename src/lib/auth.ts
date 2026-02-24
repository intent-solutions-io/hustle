/**
 * Server-Side Authentication (Firebase Auth)
 *
 * Single canonical module for all server-side auth.
 *
 * - `auth()`            – lightweight session check for API routes (no Firestore)
 * - `authWithProfile()` – session + Firestore user profile for dashboard pages
 * - `requireAuth()`     – throws if unauthenticated or email unverified
 */

import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase/admin';
import type { User } from '@/types/firestore';
import { isE2ETestMode } from '@/lib/e2e';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Session {
  user: {
    id: string;
    email: string | null;
    emailVerified: boolean;
  };
}

export interface DashboardUser {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('__session')?.value || null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Lightweight session check for API routes (no Firestore hit).
 */
export async function auth(): Promise<Session | null> {
  try {
    const sessionCookie = await getSessionCookie();
    if (!sessionCookie) return null;

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

/**
 * Session check + Firestore user profile for dashboard pages.
 * Returns null if not authenticated.
 */
export async function authWithProfile(): Promise<DashboardUser | null> {
  try {
    const sessionCookie = await getSessionCookie();
    if (!sessionCookie) return null;

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      console.error(`User document not found for UID: ${decodedToken.uid}`);
      return null;
    }

    const userData = userDoc.data() as User;
    const emailVerified = isE2ETestMode() ? true : (decodedToken.email_verified || false);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      firstName: userData.firstName,
      lastName: userData.lastName,
      emailVerified,
    };
  } catch (error: any) {
    console.error('Error getting dashboard user:', error.message);
    return null;
  }
}

/**
 * Require authenticated + email-verified user. Throws if not.
 */
export async function requireAuth(): Promise<DashboardUser> {
  const user = await authWithProfile();

  if (!user) {
    throw new Error('Unauthorized: No valid Firebase session');
  }

  if (!user.emailVerified) {
    throw new Error('Unauthorized: Email not verified');
  }

  return user;
}
