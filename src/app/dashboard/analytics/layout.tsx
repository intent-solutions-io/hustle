import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | Hustle',
  description: 'Deep performance analytics — goals, assists, win rate, and athlete comparisons over time.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
