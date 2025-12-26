/**
 * Firebase Configuration for Hustle Mobile
 *
 * Uses the Firebase JS SDK for Expo compatibility.
 * Environment variables are loaded from app.config.js or .env
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  type Auth
} from 'firebase/auth';
// @ts-expect-error - getReactNativePersistence is exported from this subpath in Firebase v12
import { getReactNativePersistence } from '@firebase/auth/react-native';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
// In production, these should come from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123',
};

// Initialize Firebase app (singleton pattern)
function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

// Initialize Firebase Auth with React Native persistence
function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();

  // Check if auth is already initialized
  try {
    return getAuth(app);
  } catch {
    // Initialize with React Native persistence for offline auth state
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}

// Initialize Firestore
function getFirebaseFirestore(): Firestore {
  const app = getFirebaseApp();
  return getFirestore(app);
}

// Export initialized instances
export const app = getFirebaseApp();
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();

// Export config for debugging
export { firebaseConfig };
