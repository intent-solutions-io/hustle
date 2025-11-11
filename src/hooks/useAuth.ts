/**
 * useAuth Hook
 *
 * React hook for Firebase Authentication.
 * Replaces NextAuth useSession hook.
 */

'use client';

import { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/firebase/auth';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
}

/**
 * Hook to get current authenticated user
 *
 * Usage:
 * const { user, loading } = useAuth();
 *
 * if (loading) return <Loading />;
 * if (!user) return <Login />;
 * return <Dashboard user={user} />;
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
