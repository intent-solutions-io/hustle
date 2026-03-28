/**
 * Firebase Admin SDK - Users Service (Server-Side)
 *
 * Server-side Firestore operations for user documents.
 * Used in Next.js server components and API routes.
 */

import { adminDb } from '../admin';
import type { User, UserDocument } from '@/types/firestore';

/**
 * Convert Firestore UserDocument to User type
 */
function toUser(uid: string, doc: UserDocument): User {
  const convertTimestamp = (ts: unknown): Date => {
    if (ts instanceof Date) return ts;
    if (ts && typeof (ts as { toDate?: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate();
    }
    return new Date();
  };

  const convertNullableTimestamp = (ts: unknown): Date | null => {
    if (ts === null || ts === undefined) return null;
    return convertTimestamp(ts);
  };

  return {
    id: uid,
    defaultWorkspaceId: doc.defaultWorkspaceId ?? null,
    ownedWorkspaces: doc.ownedWorkspaces ?? [],
    firstName: doc.firstName ?? '',
    lastName: doc.lastName ?? '',
    email: doc.email ?? '',
    phone: doc.phone,
    emailVerified: doc.emailVerified ?? false,
    agreedToTerms: doc.agreedToTerms ?? false,
    agreedToPrivacy: doc.agreedToPrivacy ?? false,
    isParentGuardian: doc.isParentGuardian ?? false,
    verificationPinHash: doc.verificationPinHash,
    termsAgreedAt: convertNullableTimestamp(doc.termsAgreedAt),
    privacyAgreedAt: convertNullableTimestamp(doc.privacyAgreedAt),
    createdAt: convertTimestamp(doc.createdAt),
    updatedAt: convertTimestamp(doc.updatedAt),
  };
}

/**
 * Get user profile by UID (Admin SDK)
 * @param uid - User UID
 * @returns User object or null if not found
 */
export async function getUserProfileAdmin(uid: string): Promise<User | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return null;
    }

    return toUser(uid, userDoc.data() as UserDocument);
  } catch (error: any) {
    console.error('Error fetching user profile (Admin):', error);
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
}

/**
 * Update user profile (Admin SDK)
 * @param uid - User UID
 * @param data - Partial user data to update
 * @returns Updated user object
 */
export async function updateUserProfileAdmin(
  uid: string,
  data: Partial<Omit<UserDocument, 'createdAt' | 'emailVerified'>>
): Promise<User> {
  try {
    const userRef = adminDb.collection('users').doc(uid);

    await userRef.update({
      ...data,
      updatedAt: new Date(),
    });

    const updatedDoc = await userRef.get();
    return toUser(uid, updatedDoc.data() as UserDocument);
  } catch (error: any) {
    console.error('Error updating user profile (Admin):', error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}
