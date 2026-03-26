'use client';

import { useState } from 'react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fetch('/api/auth/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err: unknown) {
      console.error('Reset password error:', err);
      setError('Failed to send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/sport-path.jpg')" }}
    >
      <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
          <h1 className="font-display text-3xl font-semibold text-zinc-900 mb-2 text-center">
            Reset Password
          </h1>

          {sent ? (
            <div className="text-center mt-4">
              <div className="text-5xl mb-4">📧</div>
              <p className="font-body text-zinc-600">
                Check your email for a reset link. It may take a minute to arrive.
              </p>
              <a
                href="/login"
                className="mt-6 inline-block font-display font-semibold text-amber-600 hover:text-amber-700 hover:underline underline-offset-4"
              >
                Back to Sign In
              </a>
            </div>
          ) : (
            <>
              <p className="font-body text-zinc-500 text-center mb-8">
                Enter your email and we&apos;ll send a reset link.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm font-body">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-body font-medium text-zinc-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body"
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

              <p className="mt-6 text-center text-sm font-body text-zinc-500">
                Remember it?{' '}
                <a
                  href="/login"
                  className="text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-4"
                >
                  Sign in
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
