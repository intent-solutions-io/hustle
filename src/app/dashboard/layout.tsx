import { redirect } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebarSimple from '@/components/layout/app-sidebar-simple';
import Header from '@/components/layout/header';
import { cookies } from 'next/headers';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { WorkspaceStatusBanners } from '@/components/WorkspaceStatusBanners';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Verify Firebase authentication
  const user = await getDashboardUser();

  if (!user || !user.emailVerified) {
    redirect('/login');
  }

  // Persisting the sidebar state in the cookie
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebarSimple />
      <SidebarInset>
        <Header user={user} />
        {/* Phase 6 Task 1: Workspace status banners (past_due, canceled, suspended) */}
        <WorkspaceStatusBanners />
        <main className='flex flex-1 flex-col gap-4 p-4'>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
