/**
 * Firestore Users Service
 *
 * CRUD operations for user documents.
 * Collection: /users/{userId}
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import type { UserDocument, User } from '@/types/firestore';

/**
 * Convert Firestore UserDocument to client User type
 */
function toUser(id: string, data: UserDocument): User {
  return {
    id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    termsAgreedAt: data.termsAgreedAt?.toDate() || null,
    privacyAgreedAt: data.privacyAgreedAt?.toDate() || null,
  };
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return toUser(docSnap.id, docSnap.data() as UserDocument);
}

/**
 * Get user by email (Firebase Auth UID is used as document ID)
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  // In Firebase Auth, we get the UID from auth, not from Firestore query
  // This function is primarily for migration; use Firebase Auth to get UID
  throw new Error('Use Firebase Auth to get user by email');
}

/**
 * Create new user document (called after Firebase Auth signup)
 */
export async function createUser(
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    agreedToTerms: boolean;
    agreedToPrivacy: boolean;
    isParentGuardian: boolean;
    verificationPinHash?: string | null;
    defaultWorkspaceId?: string | null;      // Phase 5: Initial workspace
    ownedWorkspaces?: string[];              // Phase 5: Owned workspace IDs
  }
): Promise<User> {
  const now = serverTimestamp();
  const userDoc: Omit<UserDocument, 'createdAt' | 'updatedAt' | 'termsAgreedAt' | 'privacyAgreedAt'> & {
    createdAt: any;
    updatedAt: any;
    termsAgreedAt: any;
    privacyAgreedAt: any;
  } = {
    // Phase 5: Workspace ownership
    defaultWorkspaceId: data.defaultWorkspaceId || null,
    ownedWorkspaces: data.ownedWorkspaces || [],

    // Profile
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone || null,
    emailVerified: false, // Will be updated by Firebase Auth
    agreedToTerms: data.agreedToTerms,
    agreedToPrivacy: data.agreedToPrivacy,
    isParentGuardian: data.isParentGuardian,
    termsAgreedAt: data.agreedToTerms ? now : null,
    privacyAgreedAt: data.agreedToPrivacy ? now : null,
    verificationPinHash: data.verificationPinHash || null,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, userDoc);

  // Return with current timestamp (approximate)
  return {
    id: userId,
    ...userDoc,
    createdAt: new Date(),
    updatedAt: new Date(),
    termsAgreedAt: data.agreedToTerms ? new Date() : null,
    privacyAgreedAt: data.agreedToPrivacy ? new Date() : null,
  };
}

/**
 * Update user document
 */
export async function updateUser(
  userId: string,
  data: Partial<Pick<UserDocument, 'firstName' | 'lastName' | 'phone' | 'emailVerified' | 'verificationPinHash' | 'defaultWorkspaceId' | 'ownedWorkspaces'>>
): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete user document (cascade deletes handled by Firestore rules)
 */
export async function deleteUser(userId: string): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await deleteDoc(docRef);
}

/**
 * Update email verification status
 */
export async function markEmailVerified(userId: string): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    emailVerified: true,
    updatedAt: serverTimestamp(),
  });
}
