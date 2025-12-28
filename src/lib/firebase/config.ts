/**
 * Firebase Configuration
 *
 * Client-side Firebase initialization for Authentication, Firestore, and Performance Monitoring.
 * Environment variables are exposed to the browser via NEXT_PUBLIC_ prefix.
 *
 * Performance Monitoring:
 * - Automatic traces: Page load, network requests
 * - Custom traces: Available via performance.trace(name)
 * - Reference: 000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Validate Firebase config at runtime (helps catch build-time env issues)
if (typeof window !== 'undefined') {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value || value === 'undefined')
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error('[Firebase] Missing config keys:', missingKeys);
    console.error('[Firebase] This usually means environment variables were not embedded at build time.');
  } else {
    console.log('[Firebase] Config loaded for project:', firebaseConfig.projectId);
  }
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Performance Monitoring (browser only)
// Automatically collects page load and network request traces
export const performance = typeof window !== 'undefined' ? getPerformance(app) : null;

export { app };
