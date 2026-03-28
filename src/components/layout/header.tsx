'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Bell, Settings, CreditCard, LogOut, UserCircle, Check } from 'lucide-react';
import { MobileSidebar } from './sidebar';
import { getInitials, getAvatarColor } from '@/lib/player-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/athletes': 'Athletes',
  '/dashboard/games': 'Games',
  '/dashboard/dream-gym': 'Dream Gym',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings': 'Settings',
  '/dashboard/billing': 'Billing',
};

// ─── Mock notifications ───────────────────────────────────────
interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [];


// ─── Notification bell ────────────────────────────────────────
function NotificationDropdown() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markOneRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative p-2 rounded-xl hover:bg-zinc-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-zinc-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full pointer-events-none" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        {/* Heading row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <span className="font-display text-sm font-semibold text-zinc-900">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-amber-500 text-white rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 font-body text-xs text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Check size={11} />
              Mark all read
            </button>
          )}
        </div>

        {/* List / empty state */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
              <Bell size={18} className="text-zinc-400" />
            </div>
            <p className="font-display text-sm font-semibold text-zinc-900 mb-1">All caught up</p>
            <p className="font-body text-xs text-zinc-400">No new notifications</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-none border-b border-zinc-50 last:border-0 cursor-pointer',
                  !n.read && 'bg-amber-50/50'
                )}
                onClick={() => markOneRead(n.id)}
              >
                <span
                  className={cn(
                    'mt-1.5 w-2 h-2 rounded-full shrink-0',
                    n.read ? 'bg-zinc-200' : 'bg-amber-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-body text-sm leading-snug',
                      n.read ? 'text-zinc-500' : 'text-zinc-800 font-medium'
                    )}
                  >
                    {n.message}
                  </p>
                  <p className="font-body text-xs text-zinc-400 mt-0.5">{n.time}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── User avatar menu ─────────────────────────────────────────
function UserMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-display font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
          avatarColor
        )}
        aria-label="User menu"
      >
        {initials}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {/* User info label */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2 pb-2">
            <p className="font-display text-sm font-semibold text-zinc-900 truncate leading-tight">
              {displayName}
            </p>
            <p className="font-body text-xs font-normal text-zinc-400 truncate mt-0.5">
              {displayEmail}
            </p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
            onClick={() => router.push('/dashboard/profile')}
          >
            <UserCircle size={15} className="text-zinc-500 shrink-0" />
            <span className="font-body text-sm">Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
            onClick={() => router.push('/dashboard/settings')}
          >
            <Settings size={15} className="text-zinc-500 shrink-0" />
            <span className="font-body text-sm">Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
            onClick={() => router.push('/dashboard/billing')}
          >
            <CreditCard size={15} className="text-zinc-500 shrink-0" />
            <span className="font-body text-sm">Billing</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex items-center gap-2 px-3 py-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut size={15} className="shrink-0" />
            <span className="font-body text-sm">Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Header ───────────────────────────────────────────────────
export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-zinc-200">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h1 className="font-display text-xl font-semibold text-zinc-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <NotificationDropdown />
        <UserMenu />
      </div>
    </header>
  );
}
