/**
 * Firebase Admin SDK Configuration
 *
 * Server-side Firebase initialization for privileged operations.
 * This should only be used in API routes and server components.
 *
 * Supports two credential modes:
 * 1. Explicit credentials (production): FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 * 2. Application Default Credentials (local dev): gcloud auth application-default login
 */

import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (singleton pattern)
if (getApps().length === 0) {
  const hasExplicitCredentials =
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  initializeApp({
    credential: hasExplicitCredentials
      ? cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
        })
      : applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

// Export Firebase Admin services
export const adminAuth = getAuth();
export const adminDb = getFirestore();
