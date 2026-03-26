import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | Hustle',
  description: 'Manage your profile, notification preferences, and account settings.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
