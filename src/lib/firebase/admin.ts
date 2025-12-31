/**
 * Firebase Admin SDK Configuration
 *
 * Server-side Firebase initialization for privileged operations.
 * This should only be used in API routes and server components.
 *
 * Supports two credential modes:
 * 1. Explicit credentials (production): FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 * 2. Application Default Credentials (local dev): gcloud auth application-default login
 *
 * Uses lazy initialization to avoid build-time errors.
 */

import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

/**
 * Initialize Firebase Admin lazily (only when first used at runtime)
 */
function initializeFirebaseAdmin(): App {
  if (_app) return _app;

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  // Priority 1: Full service account JSON (most reliable)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      _app = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
      });
      return _app;
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
    }
  }

  // Priority 2: Separate client email + private key
  const hasExplicitCredentials =
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (hasExplicitCredentials) {
    _app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    return _app;
  }

  // Priority 3: Application Default Credentials (ADC)
  _app = initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  return _app;
}

/**
 * Get Firebase Admin Auth (lazy initialization)
 */
export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    initializeFirebaseAdmin();
    _adminAuth = getAuth();
  }
  return _adminAuth;
}

/**
 * Get Firebase Admin Firestore (lazy initialization)
 */
export function getAdminDb(): Firestore {
  if (!_adminDb) {
    initializeFirebaseAdmin();
    _adminDb = getFirestore();
  }
  return _adminDb;
}

/**
 * Legacy exports for backward compatibility (lazy getters)
 *
 * These proxies forward common Firestore methods to lazily-initialized instances.
 * For full Firestore functionality (e.g., settings, terminate), use getAdminDb() directly.
 */
export const adminAuth = {
  verifyIdToken: (...args: Parameters<Auth['verifyIdToken']>) => getAdminAuth().verifyIdToken(...args),
  getUser: (...args: Parameters<Auth['getUser']>) => getAdminAuth().getUser(...args),
  getUserByEmail: (...args: Parameters<Auth['getUserByEmail']>) => getAdminAuth().getUserByEmail(...args),
  createUser: (...args: Parameters<Auth['createUser']>) => getAdminAuth().createUser(...args),
  updateUser: (...args: Parameters<Auth['updateUser']>) => getAdminAuth().updateUser(...args),
  deleteUser: (...args: Parameters<Auth['deleteUser']>) => getAdminAuth().deleteUser(...args),
  setCustomUserClaims: (...args: Parameters<Auth['setCustomUserClaims']>) => getAdminAuth().setCustomUserClaims(...args),
  generatePasswordResetLink: (...args: Parameters<Auth['generatePasswordResetLink']>) => getAdminAuth().generatePasswordResetLink(...args),
  generateEmailVerificationLink: (...args: Parameters<Auth['generateEmailVerificationLink']>) => getAdminAuth().generateEmailVerificationLink(...args),
  verifySessionCookie: (...args: Parameters<Auth['verifySessionCookie']>) => getAdminAuth().verifySessionCookie(...args),
  revokeRefreshTokens: (...args: Parameters<Auth['revokeRefreshTokens']>) => getAdminAuth().revokeRefreshTokens(...args),
  createSessionCookie: (...args: Parameters<Auth['createSessionCookie']>) => getAdminAuth().createSessionCookie(...args),
};

export const adminDb = {
  collection: (...args: Parameters<Firestore['collection']>) => getAdminDb().collection(...args),
  collectionGroup: (...args: Parameters<Firestore['collectionGroup']>) => getAdminDb().collectionGroup(...args),
  doc: (...args: Parameters<Firestore['doc']>) => getAdminDb().doc(...args),
  batch: () => getAdminDb().batch(),
  runTransaction: <T>(
    updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
    transactionOptions?: FirebaseFirestore.ReadWriteTransactionOptions
  ) => getAdminDb().runTransaction(updateFunction, transactionOptions),
  getAll: (...args: Parameters<Firestore['getAll']>) => getAdminDb().getAll(...args),
  bulkWriter: (options?: FirebaseFirestore.BulkWriterOptions) => getAdminDb().bulkWriter(options),
};
