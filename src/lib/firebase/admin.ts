import { App, initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Storage, getStorage } from 'firebase-admin/storage';

let _app: App | null = null;
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;
let _adminStorage: Storage | null = null;

function buildCredential() {
  // Option 1: full service account JSON (production Cloud Run)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    return cert(sa);
  }
  // Option 2: individual env vars (CI / local dev)
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  // Option 3: Application Default Credentials (GCP environments with attached service account)
  return applicationDefault();
}

export function getAdminApp(): App {
  if (_app) return _app;

  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0];
    return _app;
  }

  _app = initializeApp({ credential: buildCredential() });

  return _app;
}

// Lazy getters — initialized on first call, not at import time
export function getAdminAuth(): Auth {
  if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
  return _adminAuth;
}

export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(getAdminApp());
  return _adminDb;
}

export function getAdminStorageBucket() {
  if (!_adminStorage) _adminStorage = getStorage(getAdminApp());
  return _adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
}

// Legacy instance exports — old code calls adminDb.collection() / adminAuth.verifySessionCookie()
// directly on the instance rather than via the getter function.
// We create these lazily on first access via a Proxy so module-load-time errors are avoided.
function lazyInstance<T>(getter: () => T): T {
  return new Proxy({} as object, {
    get(_t, prop) {
      const instance = getter() as Record<string | symbol, unknown>;
      const val = instance[prop];
      return typeof val === 'function' ? val.bind(instance) : val;
    },
  }) as T;
}

export const adminAuth = lazyInstance(getAdminAuth);
export const adminDb   = lazyInstance(getAdminDb);
