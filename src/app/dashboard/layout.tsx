import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PageTransition } from '@/components/layout/page-transition';

export const metadata: Metadata = {
  title: 'Dashboard | Hustle',
  description: 'Your athlete performance hub — games, training, and analytics in one place.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh bg-[#ffffff]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-[#F5EEDD] to-[#EADBB8]">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
