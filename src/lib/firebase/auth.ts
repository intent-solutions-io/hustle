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
  // Create Firebase Auth account
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const user = userCredential.user;

  try {
    // Update display name
    await updateProfile(user, {
      displayName: `${data.firstName} ${data.lastName}`,
    });

    // Send email verification
    await sendEmailVerification(user);

    // Create Firestore user document
    const firestoreUser = await createUser(user.uid, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      agreedToTerms: data.agreedToTerms,
      agreedToPrivacy: data.agreedToPrivacy,
      isParentGuardian: data.isParentGuardian,
    });

    return { user, firestoreUser };
  } catch (error) {
    // Rollback: delete Firebase Auth user if Firestore creation fails
    await user.delete();
    throw error;
  }
}

/**
 * Sign in with email and password
 *
 * Requires email verification before allowing login.
 */
export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Enforce email verification
  if (!user.emailVerified) {
    await firebaseSignOut(auth);
    throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
  }

  // Sync email verification status to Firestore
  await markEmailVerified(user.uid);

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
