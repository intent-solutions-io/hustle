/**
 * ProtectedRoute Component
 *
 * Client-side auth protection that works exactly like Perception's ProtectedRoute.
 * Uses Firebase onAuthStateChanged - no server-side session cookies needed.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export default function ProtectedRoute({
  children,
  requireEmailVerification = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireEmailVerification && !user.emailVerified) {
        // Skip email verification in E2E test mode
        const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
        if (!isE2ETestMode) {
          router.push('/verify-email');
        }
      }
    }
  }, [loading, user, requireEmailVerification, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // Skip email verification check in E2E test mode
  const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
  if (requireEmailVerification && !user.emailVerified && !isE2ETestMode) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
