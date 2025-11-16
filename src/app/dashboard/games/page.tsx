import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { redirect } from 'next/navigation';
import { getAllGamesAdmin } from '@/lib/firebase/admin-services/games';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import {
  formatGameDate,
  getResultBadgeClasses,
  formatGameStats,
} from '@/lib/game-utils';
import type { GameData } from '@/types/game';

/**
 * Games History Page
 *
 * Displays all games across all athletes for the authenticated parent.
 * Features:
 * - Complete game history with athlete names
 * - Result badges (Win/Loss/Draw)
 * - Position-specific stats display
 * - Sortable table (desktop) / card list (mobile)
 * - Links to athlete detail pages
 *
 * @returns Server component rendering games history
 */
export default async function GamesHistoryPage() {
  // AUTH CHECK (Firebase Admin)
  const user = await getDashboardUser();
  if (!user || !user.emailVerified) {
    redirect('/login');
  }

  // FETCH ALL GAMES for all parent's athletes (Firestore Admin SDK)
  const games = await getAllGamesAdmin(user.uid);

  // Calculate summary stats
  const totalGames = games.length;
  const wins = games.filter((g) => g.result === 'Win').length;
  const losses = games.filter((g) => g.result === 'Loss').length;
  const winPercentage = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Games History</h1>
          <p className="text-zinc-600 mt-2">
            Complete history of all logged games across all athletes
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-base text-zinc-700 hover:text-zinc-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-200">
          <CardContent className="p-6">
            <div className="text-sm text-zinc-600 mb-1">Total Games</div>
            <div className="text-3xl font-bold text-zinc-900">{totalGames}</div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-6">
            <div className="text-sm text-zinc-600 mb-1">Wins</div>
            <div className="text-3xl font-bold text-green-600">{wins}</div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-6">
            <div className="text-sm text-zinc-600 mb-1">Losses</div>
            <div className="text-3xl font-bold text-red-600">{losses}</div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-6">
            <div className="text-sm text-zinc-600 mb-1">Win Rate</div>
            <div className="text-3xl font-bold text-zinc-900">{winPercentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* GAMES LIST */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="text-lg">All Games</CardTitle>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            // EMPTY STATE
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
                Start logging games to track performance over time
              </p>
              <Link
                href="/dashboard/athletes"
                className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                View Athletes
              </Link>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block rounded-lg border border-zinc-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Date</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Athlete</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Opponent</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Result</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Score</th>
                      <th className="text-left text-sm font-medium text-zinc-600 px-4 py-3">Stats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => (
                      <tr
                        key={game.id}
                        className="hover:bg-zinc-50 transition-colors border-t border-zinc-200"
                      >
                        <td className="text-sm text-zinc-900 px-4 py-3">
                          {formatGameDate(game.date)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/athletes/${game.player.id}`}
                            className="text-sm text-zinc-900 hover:text-zinc-700 underline"
                          >
                            {game.player.name}
                          </Link>
                        </td>
                        <td className="text-sm text-zinc-900 px-4 py-3">{game.opponent}</td>
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
                          {formatGameStats(game as unknown as GameData, game.player.position)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD LIST */}
              <div className="md:hidden space-y-3">
                {games.map((game) => (
                  <Card key={game.id} className="bg-white border-zinc-200">
                    <CardContent className="p-4">
                      {/* Header: Date + Result Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-medium text-zinc-900 mb-1">
                            {formatGameDate(game.date)}
                          </div>
                          <Link
                            href={`/dashboard/athletes/${game.player.id}`}
                            className="text-sm text-zinc-600 hover:text-zinc-900 underline"
                          >
                            {game.player.name}
                          </Link>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultBadgeClasses(
                            game.result
                          )}`}
                        >
                          {game.result}
                        </span>
                      </div>

                      {/* Game Details */}
                      <div className="space-y-2">
                        <div className="text-sm text-zinc-600">vs {game.opponent}</div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-700 font-medium">{game.finalScore}</span>
                          <span className="text-zinc-600">
                            {formatGameStats(game as unknown as GameData, game.player.position)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
