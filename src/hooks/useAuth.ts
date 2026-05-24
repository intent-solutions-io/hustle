'use client';

/**
 * Client-side auth hook.
 *
 * Phase 4.5 migration: previously subscribed to Firebase Auth's
 * onAuthStateChanged. Now reads the NextAuth session via useSession() and
 * shapes the result to match the legacy contract consumed by the header
 * (displayName, photoURL, email).
 *
 * The 'user-photo-updated' window event is honored — it triggers a
 * NextAuth session refresh so the header re-renders with the new photo.
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface AuthUserView {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

interface AuthState {
  user: AuthUserView | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const { data: session, status, update } = useSession();
  const loading = status === 'loading';

  // Refresh session on photo-update events so the header avatar updates
  // without a full reload.
  useEffect(() => {
    const onUpdate = () => {
      void update();
    };
    window.addEventListener('user-photo-updated', onUpdate);
    return () => window.removeEventListener('user-photo-updated', onUpdate);
  }, [update]);

  const sessionUser = session?.user;
  if (!sessionUser) {
    return { user: null, loading, error: null };
  }

  const displayName =
    sessionUser.name ?? sessionUser.email?.split('@')[0] ?? null;

  return {
    user: {
      uid: (sessionUser as { id?: string }).id ?? sessionUser.email ?? '',
      displayName,
      email: sessionUser.email ?? null,
      photoURL: sessionUser.image ?? null,
    },
    loading,
    error: null,
  };
}
