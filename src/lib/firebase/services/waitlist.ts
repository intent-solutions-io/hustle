/**
 * Firestore Waitlist Service
 *
 * CRUD operations for waitlist documents.
 * Collection: /waitlist/{email}
 */

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';

export interface WaitlistDocument {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  source?: string | null;
  createdAt: Date;
}

/**
 * Check if email exists on waitlist
 */
export async function isOnWaitlist(email: string): Promise<boolean> {
  const docRef = doc(db, 'waitlist', email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

/**
 * Add email to waitlist
 */
export async function addToWaitlist(data: {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}): Promise<void> {
  const docRef = doc(db, 'waitlist', data.email);
  await setDoc(docRef, {
    email: data.email,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    source: data.source || 'landing_page',
    createdAt: serverTimestamp(),
  });
}

/**
 * Get waitlist entry by email
 */
export async function getWaitlistEntry(email: string): Promise<WaitlistDocument | null> {
  const docRef = doc(db, 'waitlist', email);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    email: data.email,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    source: data.source || null,
    createdAt: data.createdAt.toDate(),
  };
}
