import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Athletes | Hustle',
  description: 'View and manage all your tracked athletes and their performance stats.',
};

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
