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
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './firebase/admin';
import type { User } from '@/types/firestore';
import { isE2ETestMode } from '@/lib/e2e';
import { ensureUserProvisioned } from '@/lib/firebase/server-provisioning';
import { withTimeout } from '@/lib/utils/timeout';

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

const SESSION_COOKIE_NAME = '__session';
const VERIFY_SESSION_COOKIE_TIMEOUT_MS = 10_000;
const USER_PROFILE_READ_TIMEOUT_MS = 10_000;
const PROVISIONING_TIMEOUT_MS = 15_000;

function getSessionCookieFromRequest(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
}

async function getSessionCookieFromHeaders(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

async function getSessionCookie(request?: NextRequest): Promise<string | null> {
  if (request) return getSessionCookieFromRequest(request);
  return getSessionCookieFromHeaders();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Lightweight session check for API routes (no Firestore hit).
 */
export async function auth(request?: NextRequest): Promise<Session | null> {
  try {
    const sessionCookie = await getSessionCookie(request);
    if (!sessionCookie) return null;

    const decodedToken = await withTimeout(
      adminAuth.verifySessionCookie(sessionCookie),
      VERIFY_SESSION_COOKIE_TIMEOUT_MS,
      'verifySessionCookie'
    );

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
export async function authWithProfile(request?: NextRequest): Promise<DashboardUser | null> {
  try {
    const sessionCookie = await getSessionCookie(request);
    if (!sessionCookie) return null;

    const decodedToken = await withTimeout(
      adminAuth.verifySessionCookie(sessionCookie, true),
      VERIFY_SESSION_COOKIE_TIMEOUT_MS,
      'verifySessionCookie'
    );

    let userDoc = await withTimeout(
      adminDb.collection('users').doc(decodedToken.uid).get(),
      USER_PROFILE_READ_TIMEOUT_MS,
      'getUserProfile'
    );

    if (!userDoc.exists) {
      try {
        await withTimeout(
          ensureUserProvisioned(decodedToken),
          PROVISIONING_TIMEOUT_MS,
          'ensureUserProvisioned'
        );

        userDoc = await withTimeout(
          adminDb.collection('users').doc(decodedToken.uid).get(),
          USER_PROFILE_READ_TIMEOUT_MS,
          'getUserProfile'
        );
      } catch (provisionError: any) {
        console.error('User provisioning failed:', provisionError?.message || provisionError);
      }

      if (!userDoc.exists) {
        console.error(`User document not found for UID: ${decodedToken.uid}`);
        return null;
      }
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
