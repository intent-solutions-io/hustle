/**
 * Firebase Authentication Service
 *
 * Replaces NextAuth v5 with Firebase Auth.
 * Handles email/password authentication, email verification, and password reset.
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
} from 'firebase/auth';
import { auth } from './config';
import { createUser, markEmailVerified } from './services/users';
import type { User } from '@/types/firestore';

/**
 * Sign up new user with email and password
 *
 * Steps:
 * 1. Create Firebase Auth account
 * 2. Update display name
 * 3. Send email verification
 * 4. Create user document in Firestore
 */
/**
 * Helper to add timeout to any promise
 */
function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

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
  console.log('[signUp] Starting registration for:', data.email);
  console.log('[signUp] Firebase auth initialized:', !!auth);
  console.log('[signUp] Firebase config project:', auth?.app?.options?.projectId);

  // Create Firebase Auth account with timeout
  console.log('[signUp] Creating Firebase Auth account...');
  let userCredential;
  try {
    userCredential = await withTimeout(
      createUserWithEmailAndPassword(auth, data.email, data.password),
      30000,
      'Firebase Auth createUser'
    );
    console.log('[signUp] Firebase Auth account created:', userCredential.user.uid);
  } catch (error: any) {
    console.error('[signUp] Firebase Auth failed:', error.code, error.message);
    throw error;
  }
  const user = userCredential.user;

  try {
    // Update display name with timeout
    console.log('[signUp] Updating profile...');
    await withTimeout(
      updateProfile(user, {
        displayName: `${data.firstName} ${data.lastName}`,
      }),
      10000,
      'Update profile'
    );
    console.log('[signUp] Profile updated');

    // Send email verification with timeout
    console.log('[signUp] Sending verification email...');
    await withTimeout(
      sendEmailVerification(user),
      10000,
      'Send verification email'
    );
    console.log('[signUp] Verification email sent');

    // Create Firestore user document with timeout
    console.log('[signUp] Creating Firestore user doc...');
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
    console.log('[signUp] Firestore user created, registration complete!');

    return { user, firestoreUser };
  } catch (error: any) {
    console.error('[signUp] Post-auth step failed:', error.message);
    // Rollback: delete Firebase Auth user if Firestore creation fails
    try {
      await user.delete();
      console.log('[signUp] Rolled back Firebase Auth user');
    } catch (deleteError) {
      console.error('[signUp] Failed to rollback user:', deleteError);
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
  console.log('[signIn] Starting sign in for:', email);
  console.log('[signIn] Firebase auth object exists:', !!auth);
  console.log('[signIn] Firebase project:', auth?.app?.options?.projectId);
  console.log('[signIn] Auth domain:', auth?.app?.options?.authDomain);

  let userCredential;
  try {
    console.log('[signIn] Calling signInWithEmailAndPassword...');
    userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('[signIn] Firebase Auth succeeded, user:', userCredential.user.uid);
  } catch (authError: any) {
    console.error('[signIn] Firebase Auth FAILED');
    console.error('[signIn] Error code:', authError?.code);
    console.error('[signIn] Error message:', authError?.message);
    throw authError;
  }

  const user = userCredential.user;
  console.log('[signIn] User email verified:', user.emailVerified);

  // Skip email verification in E2E test mode (localhost only)
  const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  console.log('[signIn] E2E mode:', isE2ETestMode, 'Localhost:', isLocalhost);

  // Enforce email verification (unless in E2E test mode on localhost)
  if (!user.emailVerified && !(isE2ETestMode && isLocalhost)) {
    console.log('[signIn] Email not verified, signing out and throwing error');
    await firebaseSignOut(auth);
    throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
  }

  // Sync email verification status to Firestore (skip in E2E test mode)
  if (user.emailVerified) {
    console.log('[signIn] Syncing email verification to Firestore...');
    try {
      await markEmailVerified(user.uid);
      console.log('[signIn] Email verification synced');
    } catch (syncError: any) {
      console.error('[signIn] Failed to sync email verification (non-fatal):', syncError?.message);
      // Don't fail login due to this - it's just a sync
    }
  }

  console.log('[signIn] Sign in complete, returning user');
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
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
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
