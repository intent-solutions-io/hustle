import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Target, PlusCircle, User, ChevronDown, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { redirect } from 'next/navigation';
import { getPlayersAdmin } from '@/lib/firebase/admin-services/players';
import {
  getVerifiedGamesCountAdmin,
  getUnverifiedGamesCountAdmin,
  getSeasonGamesCountAdmin,
  getFirstPendingGameAdmin,
} from '@/lib/firebase/admin-services/games';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { adminDb } from '@/lib/firebase/admin';
import { evaluatePlanLimits, getLimitWarningMessage } from '@/lib/billing/plan-limits';
import type { Workspace } from '@/types/firestore';

// Calculate current soccer season dates (Aug 1 - Jul 31)
function getCurrentSeasonDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = Jan, 7 = Aug)

  if (month >= 7) {
    // Aug-Dec (months 7-11): Season is current year Aug 1 to next year Jul 31
    return {
      start: new Date(year, 7, 1), // Aug 1 this year
      end: new Date(year + 1, 7, 0, 23, 59, 59, 999), // Jul 31 next year (month 7 day 0 = last day of July)
    };
  } else {
    // Jan-Jul (months 0-6): Season started last year Aug 1
    return {
      start: new Date(year - 1, 7, 1), // Aug 1 last year
      end: new Date(year, 7, 0, 23, 59, 59, 999), // Jul 31 this year (month 7 day 0 = last day of July)
    };
  }
}

export default async function DashboardPage() {
  // Server-side Firebase Auth protection
  const user = await getDashboardUser();
  if (!user || !user.emailVerified) {
    redirect('/login');
  }

  // Fetch user's workspace for plan limits evaluation
  const userDoc = await adminDb.collection('users').doc(user.uid).get();
  const userData = userDoc.data();
  const workspaceId = userData?.defaultWorkspaceId;

  let limits = null;
  if (workspaceId) {
    const workspaceDoc = await adminDb.collection('workspaces').doc(workspaceId).get();
    if (workspaceDoc.exists) {
      const workspace = {
        id: workspaceDoc.id,
        ...workspaceDoc.data(),
      } as unknown as Workspace;
      limits = evaluatePlanLimits(workspace);
    }
  }

  // Fetch total games count across all athletes (Firestore Admin SDK)
  const totalVerifiedGames = await getVerifiedGamesCountAdmin(user.uid);
  const totalUnverifiedGames = await getUnverifiedGamesCountAdmin(user.uid);

  // Fetch season games count (Aug 1 - Jul 31)
  const { start, end } = getCurrentSeasonDates();
  const seasonGames = await getSeasonGamesCountAdmin(user.uid, start, end);

  // Fetch athletes for Quick Actions logic (Firestore Admin SDK)
  const athletes = await getPlayersAdmin(user.uid);

  // Find first pending game (Firestore Admin SDK)
  const firstPendingGame = await getFirstPendingGameAdmin(user.uid);

  const verifyHref = firstPendingGame
    ? `/verify?playerId=${firstPendingGame.playerId}`
    : '/verify';

  return (
    <>
    <div className='flex flex-col gap-4'>
      {/* Welcome Section */}
      <div>
        <h1 className='text-3xl font-bold text-zinc-900'>Dashboard</h1>
        <p className='text-zinc-600 mt-2'>
          Track your athletic development and monitor your progress
        </p>
      </div>

      {/* Plan Limit Warnings */}
      {limits && (
        <>
          {/* Player Limit Warning */}
          {limits.player.state !== 'ok' && (
            <div
              className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${
                limits.player.state === 'warning'
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {getLimitWarningMessage('player', limits.player.state)}
                </p>
                <p className="text-xs mt-1 opacity-90">
                  {limits.player.used} of {limits.player.limit} players used
                </p>
              </div>
              <Link href="/dashboard/billing/change-plan" className="text-xs font-medium underline whitespace-nowrap">
                Upgrade Plan
              </Link>
            </div>
          )}

          {/* Games Limit Warning */}
          {limits.games.state !== 'ok' && (
            <div
              className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${
                limits.games.state === 'warning'
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {getLimitWarningMessage('games', limits.games.state)}
                </p>
                <p className="text-xs mt-1 opacity-90">
                  {limits.games.used} of {limits.games.limit} games this month
                </p>
              </div>
              <Link href="/dashboard/billing/change-plan" className="text-xs font-medium underline whitespace-nowrap">
                Upgrade Plan
              </Link>
            </div>
          )}
        </>
      )}

      {/* Stats Cards */}
      <div className='grid gap-6 md:grid-cols-3'>
        {/* Total Games */}
        <Card className='border-zinc-200'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-zinc-600'>
              Verified Games
            </CardTitle>
            <Calendar className='h-4 w-4 text-zinc-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-zinc-900'>{totalVerifiedGames}</div>
            <p className='text-xs text-zinc-500 mt-1'>
              {totalVerifiedGames === 0
                ? 'No verified games yet'
                : totalVerifiedGames === 1
                ? '1 verified game'
                : `${totalVerifiedGames} verified games`}
            </p>
            {totalUnverifiedGames > 0 && (
              <p className='text-xs text-amber-600 mt-3'>
                {totalUnverifiedGames} game{totalUnverifiedGames === 1 ? '' : 's'} waiting for verification.
              </p>
            )}
          </CardContent>
        </Card>

        {/* This Season */}
        <Card className='border-zinc-200'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-zinc-600'>
              Verified This Season
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-zinc-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-zinc-900'>{seasonGames}</div>
            <p className='text-xs text-zinc-500 mt-1'>
              {seasonGames === 0
                ? 'No verified games logged this season yet'
                : `${seasonGames} verified ${seasonGames === 1 ? 'game' : 'games'} this season`}
            </p>
          </CardContent>
        </Card>

        {/* Development Score */}
        <Card className='border-zinc-200'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-zinc-600'>
              Development Score
            </CardTitle>
            <Target className='h-4 w-4 text-zinc-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-zinc-900'>--</div>
            <p className='text-xs text-zinc-500 mt-1'>Complete profile to unlock</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className='border-zinc-200'>
        <CardHeader>
          <CardTitle className='text-lg'>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Add Athlete - Always enabled */}
          <Link href='/dashboard/add-athlete'>
            <Button className='w-full justify-start gap-3 h-12 bg-zinc-900 hover:bg-zinc-800'>
              <User className='h-5 w-5' />
              <span className='font-medium'>Add Athlete</span>
            </Button>
          </Link>

          {/* Log a Game - Conditional based on athlete count */}
          {athletes.length === 0 ? (
            // No athletes: Disabled button
            <Button
              disabled
              className='w-full justify-start gap-3 h-12 bg-zinc-700 hover:bg-zinc-600 opacity-50 cursor-not-allowed'
            >
              <PlusCircle className='h-5 w-5' />
              <span className='font-medium'>Log a Game (Add athlete first)</span>
            </Button>
          ) : athletes.length === 1 ? (
            // Single athlete: Direct link
            <Link href={`/dashboard/log-game?playerId=${athletes[0].id}`}>
              <Button className='w-full justify-start gap-3 h-12 bg-zinc-700 hover:bg-zinc-600'>
                <PlusCircle className='h-5 w-5' />
                <span className='font-medium'>Log a Game</span>
              </Button>
            </Link>
          ) : (
            // Multiple athletes: Dropdown menu
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className='w-full justify-start gap-3 h-12 bg-zinc-700 hover:bg-zinc-600'>
                  <PlusCircle className='h-5 w-5' />
                  <span className='font-medium'>Log a Game</span>
                  <ChevronDown className='h-4 w-4 ml-auto' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='w-[300px]'>
                <DropdownMenuLabel>Select Athlete</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {athletes.map((athlete) => (
                  <DropdownMenuItem key={athlete.id} asChild>
                    <Link href={`/dashboard/log-game?playerId=${athlete.id}`} className='cursor-pointer'>
                      <span>{athlete.name}</span>
                      <span className='ml-auto text-xs text-zinc-500'>
                        {athlete.position}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {totalUnverifiedGames > 0 && (
            <Link href={verifyHref}>
              <Button variant='outline' className='w-full justify-start gap-3 h-12 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800'>
                <Shield className='h-5 w-5' />
                <span className='font-medium'>Verify Pending Games</span>
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>

    <p className='text-xs text-zinc-500'>
      Dashboard totals include verified games only. Pending entries remain editable until they are confirmed with your PIN.
    </p>
    </>
  );
}
