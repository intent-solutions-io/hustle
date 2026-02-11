/**
 * ProtectedRoute Component
 *
 * Client-side auth protection that works with server-side session cookies.
 * The middleware already checks for session cookies before allowing access.
 * This component provides a loading state and handles email verification.
 *
 * Key insight: In Next.js with server session cookies, the middleware
 * protects routes at the edge. This component just needs to:
 * 1. Show loading while Firebase client SDK initializes
 * 2. Handle email verification redirect
 * 3. Trust that if we got here, the session cookie is valid
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

// Check if session cookie exists (client-side check)
function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  const cookies = document.cookie.split(';').map((c) => c.trim());
  return cookies.some(
    (c) => c.startsWith('__session=') || c.startsWith('firebase-auth-token=')
  );
}

export default function ProtectedRoute({
  children,
  requireEmailVerification = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const authCheckCompleteRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      authCheckCompleteRef.current = true;
      setLoading(false);
    });

    // Safety timeout: If onAuthStateChanged doesn't fire within 3s,
    // check for session cookie and proceed if present
    const timeoutId = setTimeout(() => {
      if (!authCheckCompleteRef.current) {
        console.log('[ProtectedRoute] Auth check timeout, checking session cookie');
        if (hasSessionCookie()) {
          console.log('[ProtectedRoute] Session cookie present, proceeding');
          // Trust the middleware - it already verified the session cookie
          setLoading(false);
        } else {
          console.log('[ProtectedRoute] No session cookie, redirecting to login');
          setLoading(false);
          router.push('/login');
        }
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [router]);

  useEffect(() => {
    // Only redirect if we're sure there's no auth
    // If we have a session cookie but no Firebase user, trust the cookie
    if (!loading && authCheckCompleteRef.current && !user && !hasSessionCookie()) {
      console.log('[ProtectedRoute] No user and no session cookie, redirecting');
      router.push('/login');
    } else if (
      !loading &&
      authCheckCompleteRef.current &&
      user &&
      requireEmailVerification &&
      !user.emailVerified
    ) {
      // Skip email verification in E2E test mode
      const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
      if (!isE2ETestMode) {
        router.push('/verify-email');
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

  // If we have a user, show content
  if (user) {
    // Skip email verification check in E2E test mode
    const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
    if (requireEmailVerification && !user.emailVerified && !isE2ETestMode) {
      return null; // Will redirect to verify-email
    }
    return <>{children}</>;
  }

  // If we have a session cookie but no Firebase user yet,
  // trust the server-side session and show content
  // The middleware already verified the session cookie is valid
  if (hasSessionCookie()) {
    console.log('[ProtectedRoute] Trusting session cookie, showing content');
    return <>{children}</>;
  }

  // No auth at all - will redirect
  return null;
}
