import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { redirect } from 'next/navigation';
import { getAllGamesAdmin } from '@/lib/firebase/admin-services/games';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react';

/**
 * Analytics Page
 *
 * Displays performance analytics and statistics across all athletes.
 * Features:
 * - Summary statistics (total games, win rate, goals, assists)
 * - Coming soon placeholders for advanced analytics
 * - Server-side authentication check
 *
 * @returns Server component rendering analytics dashboard
 */
export default async function AnalyticsPage() {
  // Firebase Admin auth check
  const user = await getDashboardUser();

  if (!user || !user.emailVerified) {
    redirect('/login');
  }

  // Fetch all games for the user's athletes (Firestore Admin SDK)
  const games = await getAllGamesAdmin(user.uid);

  // Calculate summary statistics
  const totalGames = games.length;
  const wins = games.filter((g) => g.result === 'Win').length;
  const losses = games.filter((g) => g.result === 'Loss').length;
  const draws = games.filter((g) => g.result === 'Draw').length;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

  const totalGoals = games.reduce((sum, g) => sum + (g.goals || 0), 0);
  const totalAssists = games.reduce((sum, g) => sum + (g.assists || 0), 0);
  const totalMinutes = games.reduce((sum, g) => sum + (g.minutesPlayed || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Analytics</h1>
        <p className="text-zinc-600 mt-2">
          Performance insights and statistics across all athletes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Total Games
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{totalGames}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {wins}W • {losses}L • {draws}D
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Win Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{winRate}%</div>
            <p className="text-xs text-zinc-500 mt-1">
              {wins} wins out of {totalGames} games
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Total Goals
            </CardTitle>
            <Target className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{totalGoals}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {totalAssists} assists
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              Minutes Played
            </CardTitle>
            <Award className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{totalMinutes}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {(totalMinutes / 60).toFixed(1)} hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Trends */}
        <Card className="border-zinc-200 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-12 w-12 text-zinc-400 mb-4" />
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">
                Coming Soon
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                Track performance trends over time with interactive charts and graphs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Position Analysis */}
        <Card className="border-zinc-200 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Position Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-zinc-400 mb-4" />
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">
                Coming Soon
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                Detailed position-specific statistics and insights
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Analytics Coming Soon */}
      {totalGames === 0 && (
        <Card className="border-zinc-200 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-16 w-16 text-zinc-400 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">
              No Data Yet
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm">
              Start logging games to see detailed analytics and performance insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
