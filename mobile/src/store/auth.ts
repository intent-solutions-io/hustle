/**
 * Auth Store (Zustand)
 *
 * Global state management for authentication.
 */

import { create } from 'zustand';
import { type User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, getUserDocument, signOut as firebaseSignOut } from '../lib/firebase';
import type { User, UserDocument } from '../types';
import { Timestamp } from 'firebase/firestore';

interface AuthState {
  // State
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  setUser: (firebaseUser: FirebaseUser | null, userDoc: UserDocument | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * Convert Firestore UserDocument to client User type
 */
function convertUserDocument(id: string, doc: UserDocument): User {
  return {
    id,
    defaultWorkspaceId: doc.defaultWorkspaceId,
    ownedWorkspaces: doc.ownedWorkspaces,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    emailVerified: doc.emailVerified,
    agreedToTerms: doc.agreedToTerms,
    agreedToPrivacy: doc.agreedToPrivacy,
    isParentGuardian: doc.isParentGuardian,
    termsAgreedAt: doc.termsAgreedAt instanceof Timestamp ? doc.termsAgreedAt.toDate() : null,
    privacyAgreedAt: doc.privacyAgreedAt instanceof Timestamp ? doc.privacyAgreedAt.toDate() : null,
    createdAt: doc.createdAt instanceof Timestamp ? doc.createdAt.toDate() : new Date(),
    updatedAt: doc.updatedAt instanceof Timestamp ? doc.updatedAt.toDate() : new Date(),
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  // Initialize auth listener
  initialize: () => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getUserDocument(firebaseUser.uid);
          if (userDoc) {
            const user = convertUserDocument(firebaseUser.uid, userDoc);
            set({
              user,
              firebaseUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // User exists in Auth but not in Firestore
            set({
              user: null,
              firebaseUser,
              isAuthenticated: false,
              isLoading: false,
              error: 'User profile not found',
            });
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
          set({
            user: null,
            firebaseUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Failed to load user profile',
          });
        }
      } else {
        set({
          user: null,
          firebaseUser: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    });

    return unsubscribe;
  },

  // Set user data
  setUser: (firebaseUser, userDoc) => {
    if (firebaseUser && userDoc) {
      const user = convertUserDocument(firebaseUser.uid, userDoc);
      set({
        user,
        firebaseUser,
        isAuthenticated: true,
        error: null,
      });
    } else {
      set({
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
      });
    }
  },

  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),

  // Set error
  setError: (error) => set({ error }),

  // Sign out
  signOut: async () => {
    try {
      await firebaseSignOut();
      set({
        user: null,
        firebaseUser: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ error: 'Failed to sign out' });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
