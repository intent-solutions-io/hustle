import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Games | Hustle',
  description: 'Browse and filter all logged games, scores, and performance stats.',
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
