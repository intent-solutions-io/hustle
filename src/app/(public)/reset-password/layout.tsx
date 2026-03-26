import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | Hustle',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
