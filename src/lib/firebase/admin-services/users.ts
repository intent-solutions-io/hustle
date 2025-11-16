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
  return {
    id: uid,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    emailVerified: doc.emailVerified,
    agreedToTerms: doc.agreedToTerms,
    agreedToPrivacy: doc.agreedToPrivacy,
    isParentGuardian: doc.isParentGuardian,
    verificationPinHash: doc.verificationPinHash,
    termsAgreedAt: doc.termsAgreedAt instanceof Date
      ? doc.termsAgreedAt
      : doc.termsAgreedAt
      ? (doc.termsAgreedAt as any).toDate()
      : null,
    privacyAgreedAt: doc.privacyAgreedAt instanceof Date
      ? doc.privacyAgreedAt
      : doc.privacyAgreedAt
      ? (doc.privacyAgreedAt as any).toDate()
      : null,
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt
      : (doc.createdAt as any).toDate(),
    updatedAt: doc.updatedAt instanceof Date
      ? doc.updatedAt
      : (doc.updatedAt as any).toDate(),
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
