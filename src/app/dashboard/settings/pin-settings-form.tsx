"use client";

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react';

interface PinSettingsFormProps {
  hasExistingPin: boolean;
}

export function PinSettingsForm({ hasExistingPin }: PinSettingsFormProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState(hasExistingPin);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/account/pin', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pin, confirmPin }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? 'Unable to update PIN');
        }

        setMessage(hasPin ? 'Verification PIN updated successfully.' : 'Verification PIN created successfully.');
        setHasPin(true);
        setPin('');
        setConfirmPin('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save verification PIN.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Unable to save PIN</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Success</p>
            <p>{message}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="pin">New PIN</Label>
        <Input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Enter 4-6 digit PIN"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          maxLength={6}
          minLength={4}
          required
          disabled={isPending}
        />
        <p className="text-xs text-zinc-500">PIN must be 4–6 digits. Share only with trusted guardians.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPin">Confirm PIN</Label>
        <Input
          id="confirmPin"
          type="password"
          inputMode="numeric"
          placeholder="Re-enter PIN"
          value={confirmPin}
          onChange={(event) => setConfirmPin(event.target.value)}
          maxLength={6}
          minLength={4}
          required
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {hasPin ? 'Update PIN' : 'Create PIN'}
      </Button>
    </form>
  );
}
