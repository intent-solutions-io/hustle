import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Hustle',
  description: 'Sign in to your Hustle account to track athlete performance and training.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
