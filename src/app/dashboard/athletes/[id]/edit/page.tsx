'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AthleteForm, AthleteFormValues } from '@/components/athletes/athlete-form';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PlayerData {
  id: string;
  name: string;
  birthday: string;
  gender: string;
  position: string;
  primaryPosition?: string;
  teamClub?: string;
  leagueCode?: string;
  photoUrl?: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditAthletePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [athlete, setAthlete] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/players');
        if (!res.ok) throw new Error('Failed to fetch players');
        const data = await res.json();
        const found = (data.players ?? []).find((p: PlayerData) => p.id === id);
        setAthlete(found ?? null);
      } catch (err) {
        console.error('Failed to load athlete:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="p-6 text-center">
        <p className="font-body text-zinc-500">Athlete not found.</p>
        <Link href="/dashboard/athletes" className="text-amber-600 hover:underline font-body text-sm mt-2 inline-block">
          Back to Athletes
        </Link>
      </div>
    );
  }

  // Split name into first/last
  const nameParts = athlete.name.split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') ?? '';

  const defaultValues: Partial<AthleteFormValues> = {
    firstName,
    lastName,
    dateOfBirth: new Date(athlete.birthday).toISOString().split('T')[0],
    gender: athlete.gender as 'male' | 'female' | 'other',
    position: athlete.primaryPosition ?? athlete.position,
    teamName: athlete.teamClub,
    league: athlete.leagueCode,
  };

  const handleSubmit = async (data: AthleteFormValues) => {
    const res = await fetch(`/api/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${data.firstName} ${data.lastName}`,
        birthday: data.dateOfBirth,
        gender: data.gender,
        primaryPosition: data.position,
        teamClub: data.teamName,
        leagueCode: data.league,
        jerseyNumber: data.jerseyNumber,
      }),
    });

    if (!res.ok) {
      throw new Error('Failed to update athlete');
    }

    router.push(`/dashboard/athletes/${id}`);
  };

  return (
    <AthleteForm
      mode="edit"
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      backHref={`/dashboard/athletes/${id}`}
    />
  );
}
