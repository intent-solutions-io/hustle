'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AthleteForm, AthleteFormValues } from '@/components/athletes/athlete-form';

export default function AddAthletePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: AthleteFormValues, _photoFile?: File) => {
    setError(null);
    const res = await fetch('/api/players/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${data.firstName} ${data.lastName}`.trim(),
        birthday: data.dateOfBirth,
        gender: data.gender,
        primaryPosition: data.position,
        teamClub: data.teamName || 'Unknown',
        leagueCode: data.league || 'other',
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message || 'Failed to add athlete. Please try again.');
      return;
    }

    router.push('/dashboard/athletes');
  };

  return (
    <>
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-body">
          {error}
        </div>
      )}
      <AthleteForm mode="add" onSubmit={handleSubmit} />
    </>
  );
}
