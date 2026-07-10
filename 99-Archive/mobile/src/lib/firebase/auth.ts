/**
 * Firebase Authentication Service
 *
 * Handles user authentication, registration, and session management.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
  type UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, type FieldValue } from 'firebase/firestore';
import { auth, db } from './config';
import type { UserDocument } from '../../types';

// Type for document creation with server timestamps
type WithServerTimestamp<T> = Omit<T, 'createdAt' | 'updatedAt' | 'termsAgreedAt' | 'privacyAgreedAt'> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
  termsAgreedAt: FieldValue | null;
  privacyAgreedAt: FieldValue | null;
};

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isParentGuardian: boolean;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(data: SignUpData): Promise<UserCredential> {
  const { email, password, firstName, lastName, isParentGuardian, agreedToTerms, agreedToPrivacy } = data;

  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;

  // Create user document in Firestore
  const userDoc: WithServerTimestamp<UserDocument> = {
    defaultWorkspaceId: null,
    ownedWorkspaces: [],
    firstName,
    lastName,
    email,
    emailVerified: false,
    agreedToTerms,
    agreedToPrivacy,
    isParentGuardian,
    termsAgreedAt: agreedToTerms ? serverTimestamp() : null,
    privacyAgreedAt: agreedToPrivacy ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', user.uid), userDoc);

  return userCredential;
}

/**
 * Sign in with email and password
 */
export async function signIn(data: SignInData): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, data.email, data.password);
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get user document from Firestore
 */
export async function getUserDocument(userId: string): Promise<UserDocument | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserDocument;
  }

  return null;
}
