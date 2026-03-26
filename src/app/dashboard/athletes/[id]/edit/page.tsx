'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AthleteForm, AthleteFormValues } from '@/components/athletes/athlete-form';
import { mockAthletes } from '@/lib/mock-data';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditAthletePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const athlete = mockAthletes.find((a) => a.id === id);

  if (!athlete) {
    return (
      <div className="p-6 text-center">
        <p className="font-body text-zinc-500">Athlete not found.</p>
      </div>
    );
  }

  const defaultValues: Partial<AthleteFormValues> = {
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    dateOfBirth: format(athlete.dateOfBirth, 'yyyy-MM-dd'),
    gender: athlete.gender,
    position: athlete.positionShort,
    teamName: athlete.teamName,
    league: athlete.league,
    jerseyNumber: athlete.jerseyNumber,
  };

  const handleSubmit = async (data: AthleteFormValues, _photoFile?: File) => {
    // TODO: update Firestore once Firebase is connected
    console.log('Update athlete:', id, data);
    await new Promise((r) => setTimeout(r, 600));
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
