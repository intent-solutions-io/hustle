/**
 * Firebase Admin SDK Configuration
 *
 * Server-side Firebase initialization for privileged operations.
 * This should only be used in API routes and server components.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (singleton pattern)
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
    }),
  });
}

// Export Firebase Admin services
export const adminAuth = getAuth();
export const adminDb = getFirestore();
