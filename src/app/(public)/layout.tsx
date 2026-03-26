import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hustle — Youth Soccer Performance Tracker',
  description: 'Sign in to Hustle and track your athlete\'s soccer performance, training, and development.',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
