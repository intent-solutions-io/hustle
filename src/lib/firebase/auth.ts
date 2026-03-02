/**
 * Firebase Authentication Service (Client-Side)
 *
 * Handles email/password authentication, email verification, and password reset.
 * For server-side auth, see src/lib/auth.ts.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  User as FirebaseUser,
  onAuthStateChanged,
  onIdTokenChanged,
} from 'firebase/auth';
import { auth } from './config';
import { createUser, markEmailVerified } from './services/users';
import type { User } from '@/types/firestore';
import { isE2ETestMode } from '@/lib/e2e';
import { withTimeout } from '@/lib/utils/timeout';

export async function signUp(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  isParentGuardian: boolean;
}): Promise<{ user: FirebaseUser; firestoreUser: User }> {
  const userCredential = await withTimeout(
    createUserWithEmailAndPassword(auth, data.email, data.password),
    30000,
    'Firebase Auth createUser'
  );
  const user = userCredential.user;

  try {
    await withTimeout(
      updateProfile(user, { displayName: `${data.firstName} ${data.lastName}` }),
      10000,
      'Update profile'
    );

    await withTimeout(sendEmailVerification(user), 10000, 'Send verification email');

    const firestoreUser = await withTimeout(
      createUser(user.uid, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        agreedToTerms: data.agreedToTerms,
        agreedToPrivacy: data.agreedToPrivacy,
        isParentGuardian: data.isParentGuardian,
      }),
      15000,
      'Create Firestore user'
    );

    return { user, firestoreUser };
  } catch (error: any) {
    // Rollback: delete Firebase Auth user if post-auth steps fail
    try {
      await user.delete();
    } catch {
      console.error('[signUp] Failed to rollback Firebase Auth user');
    }
    throw error;
  }
}

/**
 * Sign in with email and password
 *
 * Requires email verification before allowing login.
 * E2E test mode: Set NEXT_PUBLIC_E2E_TEST_MODE=true to skip email verification.
 */
export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Enforce email verification (unless in E2E test mode on localhost)
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (!user.emailVerified && !(isE2ETestMode() && isLocalhost)) {
    await firebaseSignOut(auth);
    throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
  }

  // Sync email verification status to Firestore (non-fatal)
  if (user.emailVerified) {
    markEmailVerified(user.uid).catch(() => {});
  }

  return user;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Send password reset email
 *
 * Uses ActionCodeSettings to redirect user back to our site after reset.
 * Firebase's default reset page handles the actual password change,
 * then the "Continue" link brings them to our login page.
 */
export async function resetPassword(email: string): Promise<void> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hustlestats.io';
  await sendPasswordResetEmail(auth, email, {
    url: `${origin}/login?reset=success`,
  });
}

/**
 * Update current user's password (requires recent authentication)
 */
export async function changePassword(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }

  await updatePassword(user, newPassword);
}

/**
 * Resend email verification
 */
export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }

  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }

  await sendEmailVerification(user);
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 *
 * Use this in React components to track authentication status.
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Listen to ID token changes (fires on sign-in, sign-out, and token refresh)
 *
 * Firebase auto-refreshes ID tokens ~5 minutes before expiry (every ~55 min).
 * Use this to keep the firebase-auth-token fallback cookie fresh.
 */
export function onIdTokenChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onIdTokenChanged(auth, callback);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Check if current user's email is verified
 */
export function isEmailVerified(): boolean {
  return auth.currentUser?.emailVerified || false;
}
