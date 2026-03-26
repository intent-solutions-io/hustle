import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { Auth, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase client SDK must only run in the browser.
// During SSR/build, these are null — event handlers referencing them
// never execute server-side so this is safe.
function getClientApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

const _app = getClientApp();

export const auth = (_app ? getAuth(_app) : null) as Auth;
export const db = (_app ? getFirestore(_app) : null) as Firestore;
export const storage = (_app ? getStorage(_app) : null) as FirebaseStorage;
export const googleProvider = new GoogleAuthProvider();
