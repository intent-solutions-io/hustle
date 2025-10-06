import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebarSimple from '@/components/layout/app-sidebar-simple';
import Header from '@/components/layout/header';
import { cookies } from 'next/headers';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Persisting the sidebar state in the cookie
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebarSimple />
      <SidebarInset>
        <Header user={session.user} />
        <main className='flex flex-1 flex-col gap-4 p-4'>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
