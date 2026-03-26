import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dream Gym | Hustle',
  description: 'Track workouts, practices, cardio, mental training, and athlete development.',
};

export default function DreamGymLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
