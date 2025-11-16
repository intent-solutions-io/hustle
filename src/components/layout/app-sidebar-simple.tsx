'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { Home, Users, Calendar, BarChart3, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut as firebaseSignOut } from '@/lib/firebase/auth';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'Athletes',
    href: '/dashboard/athletes',
    icon: Users
  },
  {
    title: 'Games',
    href: '/dashboard/games',
    icon: Calendar
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
];

export default function AppSidebarSimple() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  // Close mobile sidebar when navigating
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Handle Firebase sign out
  const handleSignOut = async () => {
    try {
      // Close mobile sidebar
      if (isMobile) {
        setOpenMobile(false);
      }

      // Clear Firebase client-side auth
      await firebaseSignOut();

      // Clear server-side session cookie
      await fetch('/api/auth/logout', { method: 'POST' });

      // Redirect to home
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Sidebar className="bg-zinc-50 border-r border-zinc-200">
      <SidebarHeader className='p-4 border-b border-zinc-200'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-zinc-900 rounded-md flex items-center justify-center'>
            <span className='text-white font-bold text-sm'>H</span>
          </div>
          <span className='text-lg font-semibold'>
            HUSTLE<sup className="text-[0.5em] align-super">™</sup>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link
                        href={item.href}
                        className='flex items-center gap-2'
                        onClick={handleLinkClick}
                      >
                        <Icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='p-4 border-t border-zinc-200'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className='flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50'
            >
              <LogOut className='h-4 w-4' />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
