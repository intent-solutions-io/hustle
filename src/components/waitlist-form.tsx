'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          source: 'landing_page',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSuccess(true);
      setEmail('');
      setFirstName('');
      setLastName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 bg-zinc-50 p-12 rounded-2xl border border-zinc-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-zinc-900">
            You&apos;re on the list!
          </h3>
          <p className="text-zinc-600">
            We&apos;ll notify you as soon as we&apos;re ready to launch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="First Name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-12 bg-white border-zinc-200 focus:border-zinc-900 rounded-lg"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Last Name (optional)"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-12 bg-white border-zinc-200 focus:border-zinc-900 rounded-lg"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 bg-white border-zinc-200 focus:border-zinc-900 rounded-lg"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-14 text-base font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
      >
        {isLoading ? 'Joining...' : 'Join Waitlist'}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <p className="text-xs text-center text-zinc-500">
        We&apos;ll never share your email. Unsubscribe anytime.
      </p>
    </form>
  );
}
