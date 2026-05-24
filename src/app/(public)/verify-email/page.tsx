'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type Status = 'idle' | 'verifying' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token || !email) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        });
        const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.ok) {
          setStatus('success');
          setMessage('Email verified. You can sign in now.');
        } else {
          setStatus('error');
          setMessage(data.error ?? 'Verification failed. The link may be invalid or expired.');
        }
      } catch {
        if (cancelled) return;
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, email]);

  // Token present + currently verifying / succeeded / failed
  if (token) {
    return (
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
        <div className="text-6xl mb-4">
          {status === 'verifying' && '⏳'}
          {status === 'success' && '✅'}
          {status === 'error' && '⚠️'}
        </div>
        <h1 className="font-display text-3xl font-semibold text-zinc-900 mb-3">
          {status === 'verifying' && 'Verifying…'}
          {status === 'success' && 'Email Verified'}
          {status === 'error' && 'Verification Failed'}
        </h1>
        {message && (
          <p className="font-body text-zinc-600 mb-6">{message}</p>
        )}
        <a
          href="/login"
          className="inline-block bg-zinc-900 text-white px-8 py-3 rounded-full font-display font-semibold hover:bg-zinc-800 transition-colors"
        >
          Go to Sign In
        </a>
      </div>
    );
  }

  // No token — just show the "check your email" prompt (post-register landing)
  return (
    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
      <div className="text-6xl mb-4">✉️</div>
      <h1 className="font-display text-3xl font-semibold text-zinc-900 mb-3">
        Check Your Email
      </h1>
      <p className="font-body text-zinc-600 mb-2">
        We sent a verification link to
      </p>
      <p className="font-body font-semibold text-zinc-900 mb-6">{email || 'your email'}</p>
      <p className="font-body text-sm text-zinc-500 mb-8">
        Click the link in the email to verify your account, then sign in.
      </p>
      <a
        href="/login"
        className="inline-block bg-zinc-900 text-white px-8 py-3 rounded-full font-display font-semibold hover:bg-zinc-800 transition-colors"
      >
        Go to Sign In
      </a>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/sport-path.jpg')" }}
    >
      <div className="min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <Suspense fallback={null}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
