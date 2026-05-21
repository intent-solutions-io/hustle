'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const mode: 'request' | 'reset' = token ? 'reset' : 'request';

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      console.error('Forgot-password error:', err);
      setError('Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Reset failed. Try requesting a new link.');
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      console.error('Reset error:', err);
      setError('Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
      <h1 className="font-display text-3xl font-semibold text-zinc-900 mb-2 text-center">
        {mode === 'request' ? 'Reset Password' : 'Choose a New Password'}
      </h1>
      <p className="font-body text-zinc-500 text-center mb-8">
        {mode === 'request'
          ? 'Enter your email and we will send a reset link.'
          : 'Enter the new password for your account.'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm font-body">
          {error}
        </div>
      )}

      {mode === 'request' && !sent && (
        <form onSubmit={requestReset} className="space-y-4">
          <div>
            <label className="block text-sm font-body font-medium text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body placeholder:text-zinc-400"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-3 rounded-full font-display font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}

      {mode === 'request' && sent && (
        <div className="text-center">
          <div className="text-5xl mb-4">✉️</div>
          <p className="font-body text-zinc-600">
            If an account exists for that email, a password-reset link has been sent. The link is good for 15 minutes.
          </p>
        </div>
      )}

      {mode === 'reset' && !done && (
        <form onSubmit={submitReset} className="space-y-4">
          <div>
            <label className="block text-sm font-body font-medium text-zinc-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body placeholder:text-zinc-400"
              placeholder="8+ characters"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-zinc-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body placeholder:text-zinc-400"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-3 rounded-full font-display font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}

      {mode === 'reset' && done && (
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="font-body text-zinc-600">
            Password updated. Redirecting to sign in…
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm font-body text-zinc-500">
        <a
          href="/login"
          className="text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-4"
        >
          Back to Sign In
        </a>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/sport-path.jpg')" }}
    >
      <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <Suspense fallback={null}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
