import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { redirect, notFound } from 'next/navigation';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import { getAllGamesForPlayerAdmin } from '@/lib/firebase/admin-services/games';
import { getDreamGymAdmin } from '@/lib/firebase/admin-services/dream-gym';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ChevronLeft,
  Calendar,
  Target,
  Users,
  Clock,
  Shield,
  Edit,
  Dumbbell,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { DeleteAthleteButton } from '@/components/delete-athlete-button';
import { AIStrategyCard } from '@/components/dream-gym/AIStrategyCard';
import { calculateAge, getInitials } from '@/lib/player-utils';
import {
  formatGameDate,
  formatGameDateMobile,
  formatGameStats,
  getResultBadgeClasses,
  calculateAthleteStats,
} from '@/lib/game-utils';
import type { AthleteDetailPageProps, GameData, AthleteStats } from '@/types/game';
import type { Player, Game } from '@/types/firestore';

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic';

/**
 * Athlete Detail Page
 *
 * Displays an individual athlete's profile, aggregated statistics, and game history.
 * Features:
 * - Athlete profile card with avatar, name, position, age, and team
 * - Aggregated stats grid (games, goals, assists/clean sheets, minutes)
 * - Games history table (desktop) / card list (mobile)
 * - Empty state for athletes with no games
 * - Server-side authentication and authorization
 * - Responsive design with mobile-first approach
 *
 * @param params - Dynamic route parameters containing athlete ID
 * @returns Server component rendering athlete detail page
 */
export default async function AthleteDetailPage({
  params,
}: AthleteDetailPageProps) {
  // Await params before accessing properties (Next.js 15 requirement)
  const { id } = await params;

  // 1. AUTH CHECK: Verify user is authenticated (Firebase Admin)
  const user = await getDashboardUser();
  if (!user || !user.emailVerified) {
    redirect('/login');
  }

  // 2. FETCH ATHLETE: Get athlete data with ownership verification (Firestore Admin SDK)
  // CRITICAL: Firestore security rules enforce ownership, but we verify UID match
  const athlete: Player | null = await getPlayerAdmin(user.uid, id);

  // 404 if athlete not found or not owned by this parent
  if (!athlete) {
    notFound();
  }

  // 3. FETCH GAMES + DREAM GYM in parallel (Firestore Admin SDK)
  const [games, dreamGym] = await Promise.all([
    getAllGamesForPlayerAdmin(user.uid, athlete.id),
    getDreamGymAdmin(user.uid, athlete.id),
  ]);

  const verifiedGames = games.filter((game) => game.verified);
  const pendingGames = games.filter((game) => !game.verified);
  const hasDreamGym = dreamGym?.profile?.onboardingComplete ?? false;

  // 5. CALCULATE AGGREGATED STATS using utility function (verified games only)
  const stats: AthleteStats = calculateAthleteStats(verifiedGames as GameData[]);

  // 5. CALCULATE DISPLAY VALUES
  const age: number = calculateAge(athlete.birthday);
  const initials: string = getInitials(athlete.name);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER: Back link + Action buttons */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/athletes"
          className="flex items-center gap-2 text-base text-zinc-700 hover:text-zinc-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Athletes
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/dashboard/athletes/${athlete.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </Button>

          <DeleteAthleteButton athleteId={athlete.id} athleteName={athlete.name} />

          <Button asChild className="bg-zinc-900 hover:bg-zinc-800">
            <Link href={`/dashboard/log-game?playerId=${athlete.id}`}>
              Log a Game
            </Link>
          </Button>
        </div>
      </div>

      {/* ATHLETE PROFILE CARD */}
      <Card className="bg-white border-zinc-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Avatar className="h-20 w-20">
              {athlete.photoUrl ? (
                <AvatarImage src={athlete.photoUrl} alt={`${athlete.name} profile`} />
              ) : null}
              <AvatarFallback className="bg-zinc-100 text-zinc-700 text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Athlete Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-zinc-900 mb-1">
                {athlete.name}
              </h1>
              <p className="text-sm text-zinc-600">
                {athlete.position} • {age} years old
              </p>
              <p className="text-sm text-zinc-600 mt-1">
                {athlete.teamClub}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STATS GRID */}
      <Card className="bg-white border-zinc-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Total Games */}
            <div className="flex flex-col items-center text-center p-4 bg-zinc-50 rounded-lg">
              <Calendar className="h-5 w-5 text-zinc-500 mb-2" />
              <div className="text-3xl font-bold text-zinc-900 mb-1">
                {stats.totalGames}
              </div>
              <div className="text-sm font-medium text-zinc-500">
                Verified Games
              </div>
              {pendingGames.length > 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  {pendingGames.length} pending verification
                </p>
              )}
            </div>

            {/* Goals */}
            <div className="flex flex-col items-center text-center p-4 bg-zinc-50 rounded-lg">
              <Target className="h-5 w-5 text-zinc-500 mb-2" />
              <div className="text-3xl font-bold text-zinc-900 mb-1">
                {stats.totalGoals}
              </div>
              <div className="text-sm font-medium text-zinc-500">
                Goals
              </div>
            </div>

            {/* Assists OR Clean Sheets (position-dependent) */}
            {athlete.position === 'Goalkeeper' ? (
              <div className="flex flex-col items-center text-center p-4 bg-zinc-50 rounded-lg">
                <Shield className="h-5 w-5 text-zinc-500 mb-2" />
                <div className="text-3xl font-bold text-zinc-900 mb-1">
                  {stats.cleanSheets}
                </div>
                <div className="text-sm font-medium text-zinc-500">
                  Clean Sheets
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-4 bg-zinc-50 rounded-lg">
                <Users className="h-5 w-5 text-zinc-500 mb-2" />
                <div className="text-3xl font-bold text-zinc-900 mb-1">
                  {stats.totalAssists}
                </div>
                <div className="text-sm font-medium text-zinc-500">
                  Assists
                </div>
              </div>
            )}

            {/* Minutes */}
            <div className="flex flex-col items-center text-center p-4 bg-zinc-50 rounded-lg">
              <Clock className="h-5 w-5 text-zinc-500 mb-2" />
              <div className="text-3xl font-bold text-zinc-900 mb-1">
                {stats.totalMinutes.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-zinc-500">
                Minutes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DREAM GYM / AI STRATEGY SECTION */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Dream Gym Link */}
        <Link href={`/dashboard/dream-gym?playerId=${athlete.id}`}>
          <Card className="border-zinc-200 cursor-pointer hover:border-zinc-400 transition-colors h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Dream Gym
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600">
                {hasDreamGym
                  ? 'View personalized training program and track workouts.'
                  : 'Set up a personalized training program for this athlete.'}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* AI Strategy Card - Only show if Dream Gym is set up */}
        {hasDreamGym && (
          <AIStrategyCard playerId={athlete.id} compact />
        )}
      </div>

      {/* GAMES HISTORY SECTION */}
      <Card className="bg-white border-zinc-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-zinc-900">
            Games History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            // EMPTY STATE: No games logged yet
            <div className="text-center py-12">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center">
                  <span className="text-4xl">⚽</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                No games logged yet
              </h3>
              <p className="text-sm text-zinc-600 mb-6">
                Get started by logging {athlete.name}&apos;s first game to track progress
              </p>
              <Button asChild className="bg-zinc-900 hover:bg-zinc-800">
                <Link href={`/dashboard/log-game?playerId=${athlete.id}`}>
                  Log a Game
                </Link>
              </Button>
            </div>
          ) : (
            // GAMES LIST
            <div>
              {/* DESKTOP TABLE (hidden on mobile) */}
              <div className="hidden md:block rounded-lg border border-zinc-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Date</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Opponent</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Status</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Result</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Score</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Stats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game: GameData) => (
                      <tr key={game.id} className="hover:bg-zinc-50 transition-colors border-t border-zinc-200">
                        <td className="text-sm text-zinc-900 px-4 py-3">
                          {formatGameDate(game.date)}
                        </td>
                        <td className="text-sm text-zinc-900 px-4 py-3">{game.opponent}</td>
                        <td className="text-sm text-zinc-900 px-4 py-3">
                          {game.verified ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                              Pending PIN
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultBadgeClasses(
                              game.result
                            )}`}
                          >
                            {game.result}
                          </span>
                        </td>
                        <td className="text-sm text-zinc-700 px-4 py-3">{game.finalScore}</td>
                        <td className="text-sm text-zinc-700 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{formatGameStats(game, athlete.position)}</span>
                            {!game.verified && (
                              <span className="text-xs font-medium text-amber-600">
                                Awaiting verification
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD LIST */}
              <div className="md:hidden space-y-3">
                {games.map((game: GameData) => (
                  <Card key={game.id} className="bg-white border-zinc-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-medium text-zinc-900 mb-1">
                            {formatGameDateMobile(game.date)}
                          </div>
                          <div className="text-sm text-zinc-600">vs {game.opponent}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultBadgeClasses(
                              game.result
                            )}`}
                          >
                            {game.result}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${game.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {game.verified ? 'Verified' : 'Pending PIN'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-700 font-medium">{game.finalScore}</span>
                        <span className="text-zinc-600">
                          {formatGameStats(game, athlete.position)}
                        </span>
                      </div>
                      {!game.verified && (
                        <p className="mt-2 text-xs font-medium text-amber-600">
                          Awaiting parent verification
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
