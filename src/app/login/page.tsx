'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signIn as firebaseSignIn } from '@/lib/firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';

// Helper to add timeout to any promise
function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        console.error(`[Login] TIMEOUT: ${operation} after ${ms}ms`);
        reject(new Error(`${operation} timed out. Please check your connection and try again.`));
      }, ms)
    ),
  ]);
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Show contextual messages based on query params
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Account created! Please check your email and click the verification link before logging in.');
    } else if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Password reset successfully! You can now log in with your new password.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('[Login] Form submitted for:', formData.email);
    console.log('[Login] Starting login flow...');

    try {
      // Step 1: Firebase Auth sign in (30s timeout)
      // This is all we need - Firebase SDK handles everything else
      console.log('[Login] Calling Firebase Auth signIn...');
      const startAuth = Date.now();
      let user;
      try {
        user = await withTimeout(
          firebaseSignIn(formData.email, formData.password),
          30000,
          'Sign in'
        );
        console.log('[Login] Firebase Auth completed in', Date.now() - startAuth, 'ms');
        console.log('[Login] User UID:', user.uid, 'Email verified:', user.emailVerified);
      } catch (authError: any) {
        console.error('[Login] Firebase Auth error:', authError?.code, authError?.message);
        throw authError;
      }

      // Step 2: Set session cookie for server-side routes (optional, best-effort)
      // This allows SSR pages to know user is authenticated, but client-side
      // auth (onAuthStateChanged) is the primary protection mechanism
      console.log('[Login] Setting session cookie (best-effort)...');
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          credentials: 'include',
        });
        console.log('[Login] Session cookie set');
      } catch (sessionError: any) {
        // Don't fail login if session cookie fails - client-side auth still works
        console.warn('[Login] Session cookie failed (non-fatal):', sessionError?.message);
      }

      // Step 3: Redirect to dashboard
      console.log('[Login] Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('[Login] FINAL ERROR CAUGHT:');
      console.error('[Login] Error type:', typeof error);
      console.error('[Login] Error code:', error?.code);
      console.error('[Login] Error message:', error?.message);
      console.error('[Login] Error name:', error?.name);
      console.error('[Login] Full error object:', error);

      // Provide user-friendly error messages
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';

      if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again.');
      } else if (errorCode === 'auth/user-not-found') {
        setError('No account found with this email. Please check your email or create an account.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many login attempts. Please wait a few minutes and try again.');
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (errorCode === 'auth/invalid-api-key') {
        setError('Configuration error. Please contact support.');
        console.error('[Login] CRITICAL: Invalid Firebase API key!');
      } else if (errorMessage.includes('verify your email')) {
        setError(errorMessage);
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      console.log('[Login] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative flex flex-col"
      style={{
        backgroundImage: 'url(/images/tracks.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Header */}
      <header className="relative z-10 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-white hover:text-white/80">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <span className="text-zinc-900 font-bold text-xs">H</span>
            </div>
            <span className="text-lg font-semibold text-white">
              HUSTLE<sup className="text-[0.5em] align-super">™</sup>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-24">
        <Card className="w-full max-w-md border-zinc-200 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-semibold text-zinc-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-zinc-600">
              Sign in to access your performance dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Success Message (registration, password reset) */}
              {successMessage && !error && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                  {error.includes('verify your email') && (
                    <p className="text-sm text-red-600 ml-6">
                      <Link href="/resend-verification" className="underline font-medium hover:text-red-700">
                        Resend verification email
                      </Link>
                    </p>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jordan@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-700 font-medium">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-11 pr-10"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Register Link */}
              <p className="text-center text-sm text-zinc-600">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-zinc-900 font-medium hover:underline">
                  Create Account
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
