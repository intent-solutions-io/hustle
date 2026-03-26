'use client';

import { useRouter } from 'next/navigation';
import { AthleteForm, AthleteFormValues } from '@/components/athletes/athlete-form';

export default function AddAthletePage() {
  const router = useRouter();

  const handleSubmit = async (data: AthleteFormValues, _photoFile?: File) => {
    // TODO: save to Firestore once Firebase is connected
    console.log('Add athlete:', data);
    // Simulate save delay
    await new Promise((r) => setTimeout(r, 600));
    router.push('/dashboard/athletes');
  };

  return <AthleteForm mode="add" onSubmit={handleSubmit} />;
}
