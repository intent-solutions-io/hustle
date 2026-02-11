/**
 * ProtectedRoute Component
 *
 * Lightweight client-side auth wrapper that works with server-side middleware.
 *
 * The middleware already protects /dashboard/* routes by checking for session
 * cookies. If the user reaches this component, they have a valid session.
 *
 * This component provides:
 * 1. A brief loading state while Firebase client SDK initializes
 * 2. Email verification redirect for users who haven't verified their email
 *
 * It does NOT redirect to /login - that's handled by middleware.
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
    // Set a timeout to stop loading even if onAuthStateChanged is slow
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    // Only handle email verification redirect - middleware handles auth
    if (!loading && user && requireEmailVerification && !user.emailVerified) {
      const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
      if (!isE2ETestMode) {
        router.push('/verify-email');
      }
    }
  }, [loading, user, requireEmailVerification, router]);

  // Show loading spinner briefly while Firebase SDK initializes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  // If user exists and email verification is required but not verified, show nothing (redirect happening)
  if (user && requireEmailVerification && !user.emailVerified) {
    const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
    if (!isE2ETestMode) {
      return null;
    }
  }

  // Trust the middleware - if we got here, the session cookie is valid
  // Show content regardless of whether Firebase client-side auth has loaded
  return <>{children}</>;
}
