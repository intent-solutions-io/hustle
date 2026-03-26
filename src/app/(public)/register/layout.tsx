import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account | Hustle',
  description: 'Create your free Hustle account and start tracking athlete performance today.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
