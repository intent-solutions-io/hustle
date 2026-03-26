import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing | Hustle',
  description: 'Manage your Hustle subscription, plan, and billing history.',
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
