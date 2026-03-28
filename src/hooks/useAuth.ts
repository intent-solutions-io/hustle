'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setState({ user, loading: false, error: null });
      },
      (error) => {
        setState({ user: null, loading: false, error });
      }
    );

    // Listen for profile photo updates (custom event from UserProfilePhotoUpload)
    const handlePhotoUpdate = () => {
      const user = auth.currentUser;
      if (user) {
        setState((prev) => ({ ...prev, user: { ...user } }));
      }
    };
    window.addEventListener('user-photo-updated', handlePhotoUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('user-photo-updated', handlePhotoUpdate);
    };
  }, []);

  return state;
}
