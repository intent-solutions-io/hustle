/**
 * useAuth Hook
 *
 * Convenient hook for accessing auth state and actions.
 */

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';

export function useAuth() {
  const {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    error,
    initialize,
    signOut,
    clearError,
  } = useAuthStore();

  // Initialize auth listener on mount
  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    error,
    signOut,
    clearError,
  };
}
