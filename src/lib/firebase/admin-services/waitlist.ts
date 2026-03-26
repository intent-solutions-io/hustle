/**
 * Firebase Admin SDK - Waitlist Service (Server-Side)
 *
 * Server-side Firestore operations for waitlist documents.
 * Used in Next.js API routes.
 * Collection: /waitlist/{email}
 */

import { adminDb } from '../admin';

export interface WaitlistDocument {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  source?: string | null;
  createdAt: Date;
}

/**
 * Check if email exists on waitlist (Admin SDK)
 */
export async function isOnWaitlistAdmin(email: string): Promise<boolean> {
  const docRef = adminDb.collection('waitlist').doc(email);
  const docSnap = await docRef.get();
  return docSnap.exists;
}

/**
 * Add email to waitlist (Admin SDK)
 */
export async function addToWaitlistAdmin(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}): Promise<void> {
  const docRef = adminDb.collection('waitlist').doc(data.email);
  await docRef.set({
    email: data.email,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    source: data.source || 'landing_page',
    createdAt: new Date(),
  });
}

/**
 * Get waitlist entry by email (Admin SDK)
 */
export async function getWaitlistEntryAdmin(email: string): Promise<WaitlistDocument | null> {
  const docRef = adminDb.collection('waitlist').doc(email);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  const data = docSnap.data()!;
  return {
    email: data.email,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    source: data.source || null,
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
  };
}
