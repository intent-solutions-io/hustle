import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { redirect } from 'next/navigation';
import { getAllGamesAdmin } from '@/lib/firebase/admin-services/games';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, Award, BarChart3, Goal, Shield, Users } from 'lucide-react';

// Position category mapping
const POSITION_CATEGORIES: Record<string, string> = {
  'GK': 'Goalkeeper',
  'CB': 'Defender',
  'LB': 'Defender',
  'RB': 'Defender',
  'DM': 'Midfielder',
  'CM': 'Midfielder',
  'AM': 'Midfielder',
  'LM': 'Midfielder',
  'RM': 'Midfielder',
  'LW': 'Forward',
  'RW': 'Forward',
  'ST': 'Forward',
  'CF': 'Forward',
};

// Get last 6 months for trends
function getLast6Months(): { month: string; year: number; key: string }[] {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      key: `${date.getFullYear()}-${date.getMonth()}`,
    });
  }
  return months;
}

/**
 * Analytics Page
 *
 * Displays performance analytics and statistics across all athletes.
 * Features:
 * - Summary statistics (total games, win rate, goals, assists)
 * - Performance trends over time
 * - Position-based analysis
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

  // Calculate monthly trends for last 6 months
  const last6Months = getLast6Months();
  const monthlyStats = last6Months.map(({ month, year, key }) => {
    const monthGames = games.filter((g) => {
      const gameDate = new Date(g.date);
      return `${gameDate.getFullYear()}-${gameDate.getMonth()}` === key;
    });
    return {
      month,
      year,
      games: monthGames.length,
      goals: monthGames.reduce((sum, g) => sum + (g.goals || 0), 0),
      assists: monthGames.reduce((sum, g) => sum + (g.assists || 0), 0),
      wins: monthGames.filter((g) => g.result === 'Win').length,
    };
  });

  // Calculate position-based stats
  const positionStats = games.reduce((acc, game) => {
    const position = game.player?.position || 'Unknown';
    const category = POSITION_CATEGORIES[position] || 'Other';

    if (!acc[category]) {
      acc[category] = {
        games: 0,
        goals: 0,
        assists: 0,
        tackles: 0,
        saves: 0,
        cleanSheets: 0,
        minutes: 0,
      };
    }

    acc[category].games += 1;
    acc[category].goals += game.goals || 0;
    acc[category].assists += game.assists || 0;
    acc[category].tackles += game.tackles || 0;
    acc[category].saves += game.saves || 0;
    acc[category].cleanSheets += game.cleanSheet ? 1 : 0;
    acc[category].minutes += game.minutesPlayed || 0;

    return acc;
  }, {} as Record<string, { games: number; goals: number; assists: number; tackles: number; saves: number; cleanSheets: number; minutes: number }>);

  // Find max values for trend bars
  const maxMonthlyGames = Math.max(...monthlyStats.map((m) => m.games), 1);
  const maxMonthlyGoals = Math.max(...monthlyStats.map((m) => m.goals), 1);

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

      {/* Analytics Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Trends */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trends
            </CardTitle>
            <p className="text-xs text-zinc-500">Last 6 months activity</p>
          </CardHeader>
          <CardContent>
            {totalGames === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">Log games to see trends</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Games per month */}
                <div>
                  <div className="flex justify-between text-xs text-zinc-500 mb-2">
                    <span>Games Played</span>
                    <span>{totalGames} total</span>
                  </div>
                  <div className="flex items-end gap-1 h-16">
                    {monthlyStats.map((stat, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-zinc-900 rounded-t transition-all"
                          style={{
                            height: `${(stat.games / maxMonthlyGames) * 100}%`,
                            minHeight: stat.games > 0 ? '4px' : '0px',
                          }}
                        />
                        <span className="text-[10px] text-zinc-400 mt-1">{stat.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals per month */}
                <div>
                  <div className="flex justify-between text-xs text-zinc-500 mb-2">
                    <span>Goals Scored</span>
                    <span>{totalGoals} total</span>
                  </div>
                  <div className="flex items-end gap-1 h-16">
                    {monthlyStats.map((stat, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-emerald-500 rounded-t transition-all"
                          style={{
                            height: `${(stat.goals / maxMonthlyGoals) * 100}%`,
                            minHeight: stat.goals > 0 ? '4px' : '0px',
                          }}
                        />
                        <span className="text-[10px] text-zinc-400 mt-1">{stat.goals}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent trend summary */}
                <div className="pt-2 border-t border-zinc-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">This month</span>
                    <span className="font-medium">
                      {monthlyStats[5]?.games || 0} games, {monthlyStats[5]?.goals || 0} goals, {monthlyStats[5]?.assists || 0} assists
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Position Analysis */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Position Analysis
            </CardTitle>
            <p className="text-xs text-zinc-500">Stats by position category</p>
          </CardHeader>
          <CardContent>
            {totalGames === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="h-10 w-10 text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">Log games to see position stats</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(positionStats).map(([position, stats]) => (
                  <div key={position} className="p-3 bg-zinc-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {position === 'Goalkeeper' && <Shield className="h-4 w-4 text-blue-500" />}
                        {position === 'Defender' && <Shield className="h-4 w-4 text-amber-500" />}
                        {position === 'Midfielder' && <Target className="h-4 w-4 text-purple-500" />}
                        {position === 'Forward' && <Goal className="h-4 w-4 text-emerald-500" />}
                        {!['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].includes(position) && (
                          <Users className="h-4 w-4 text-zinc-500" />
                        )}
                        <span className="font-medium text-sm">{position}</span>
                      </div>
                      <span className="text-xs text-zinc-500">{stats.games} games</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {position === 'Goalkeeper' ? (
                        <>
                          <div className="text-center">
                            <div className="font-semibold text-zinc-900">{stats.saves}</div>
                            <div className="text-zinc-500">Saves</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-zinc-900">{stats.cleanSheets}</div>
                            <div className="text-zinc-500">Clean Sheets</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-zinc-900">{Math.round(stats.minutes / 60)}h</div>
                            <div className="text-zinc-500">Played</div>
                          </div>
                        </>
                      ) : position === 'Defender' ? (
                        <>
                          <div className="text-center">
                            <div className="font-semibold text-zinc-900">{stats.tackles}</div>
                            <div className="text-zinc-500">Tackles</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-zinc-900">{stats.goals}</div>
                            <div className="text-zinc-500">Goals</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-zinc-900">{stats.assists}</div>
                            <div className="text-zinc-500">Assists</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center">
                            <div className="font-semibold text-zinc-900">{stats.goals}</div>
                            <div className="text-zinc-500">Goals</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-zinc-900">{stats.assists}</div>
                            <div className="text-zinc-500">Assists</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-zinc-900">
                              {stats.games > 0 ? (stats.goals / stats.games).toFixed(1) : '0'}
                            </div>
                            <div className="text-zinc-500">Per Game</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {Object.keys(positionStats).length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">No position data available</p>
                )}
              </div>
            )}
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
