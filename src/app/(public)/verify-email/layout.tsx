import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email | Hustle',
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
