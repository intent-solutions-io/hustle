'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? 'your email';

  return (
    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl text-center">
      <div className="text-6xl mb-4">✉️</div>
      <h1 className="font-display text-3xl font-semibold text-zinc-900 mb-3">
        Check Your Email
      </h1>
      <p className="font-body text-zinc-600 mb-2">
        We sent a verification link to
      </p>
      <p className="font-body font-semibold text-zinc-900 mb-6">{email}</p>
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
