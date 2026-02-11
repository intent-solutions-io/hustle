import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebarSimple from '@/components/layout/app-sidebar-simple';
import Header from '@/components/layout/header';
import { cookies } from 'next/headers';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { WorkspaceStatusBanners } from '@/components/WorkspaceStatusBanners';
import ProtectedRoute from '@/components/ProtectedRoute';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Try to get user from session cookie (for SSR personalization)
  // If this fails, the client-side ProtectedRoute will handle auth
  let user = null;
  try {
    user = await getDashboardUser();
  } catch (error: any) {
    console.warn('[DashboardLayout] Session verification failed:', error?.message);
    // Continue - client-side ProtectedRoute will handle auth
  }

  // Persisting the sidebar state in the cookie
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  // If no user from server, use placeholder for SSR
  // Client-side ProtectedRoute will redirect if not authenticated
  const displayUser = user || {
    uid: '',
    email: null,
    firstName: undefined,
    lastName: undefined,
    emailVerified: false,
  };

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebarSimple />
        <SidebarInset>
          <Header user={displayUser} />
          {/* Phase 6 Task 1: Workspace status banners (past_due, canceled, suspended) */}
          <WorkspaceStatusBanners />
          <main className='flex flex-1 flex-col gap-4 p-4'>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
