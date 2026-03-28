'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2, Mail } from 'lucide-react';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Verification email sent successfully');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/sport-path.jpg')" }}
    >
      <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
          {status === 'success' ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-zinc-900 mb-2">
                Check Your Email
              </h1>
              <p className="font-body text-sm text-zinc-500 mb-2">{message}</p>
              <p className="font-body text-xs text-zinc-400 mb-8">
                If you don&apos;t see the email, check your spam folder.
              </p>
              <Link
                href="/login"
                className="inline-block w-full bg-zinc-900 text-white py-3 rounded-full font-display font-semibold text-sm hover:bg-zinc-800 transition-colors text-center"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 mb-4">
                  <Mail className="w-7 h-7 text-amber-500" />
                </div>
                <h1 className="font-display text-2xl font-semibold text-zinc-900 mb-2">
                  Resend Verification
                </h1>
                <p className="font-body text-sm text-zinc-500">
                  Enter your email and we&apos;ll send a new verification link.
                </p>
              </div>

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 font-body text-sm">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-body font-medium text-zinc-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-body text-sm placeholder:text-zinc-400 transition-colors"
                    placeholder="you@example.com"
                    disabled={status === 'loading'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 rounded-full font-display font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                  {status === 'loading' ? 'Sending...' : 'Send Verification Email'}
                </button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm font-body text-amber-600 hover:text-amber-700 hover:underline underline-offset-4"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
