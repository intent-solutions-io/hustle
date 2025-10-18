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
  SidebarRail
} from '@/components/ui/sidebar';
import { Home, Users, Calendar, BarChart3, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

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

  return (
    <Sidebar>
      <SidebarHeader className='p-4 border-b'>
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
                      <Link href={item.href} className='flex items-center gap-2'>
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

      <SidebarFooter className='p-4 border-t'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: '/' })}
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
