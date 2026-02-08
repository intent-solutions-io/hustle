'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GameData {
  id: string;
  date: Date;
  goals: number;
  assists: number;
  minutesPlayed: number;
  result: 'Win' | 'Loss' | 'Draw';
  opponent: string;
}

interface PerformanceTrendsChartProps {
  games: GameData[];
}

export function PerformanceTrendsChart({ games }: PerformanceTrendsChartProps) {
  // Sort games by date (oldest first for chart display)
  const sortedGames = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Take last 10 games for the chart
  const recentGames = sortedGames.slice(-10);

  if (recentGames.length === 0) {
    return (
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="text-lg">Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-12 w-12 text-zinc-300 mb-4" />
            <p className="text-sm text-zinc-500">
              Log games to see performance trends
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate max values for scaling
  const maxGoals = Math.max(...recentGames.map((g) => g.goals), 1);
  const maxAssists = Math.max(...recentGames.map((g) => g.assists), 1);
  const maxContributions = Math.max(...recentGames.map((g) => g.goals + g.assists), 1);

  // Calculate trend (comparing first half to second half of recent games)
  const midpoint = Math.floor(recentGames.length / 2);
  const firstHalf = recentGames.slice(0, midpoint);
  const secondHalf = recentGames.slice(midpoint);

  const avgFirstHalf =
    firstHalf.length > 0
      ? firstHalf.reduce((sum, g) => sum + g.goals + g.assists, 0) / firstHalf.length
      : 0;
  const avgSecondHalf =
    secondHalf.length > 0
      ? secondHalf.reduce((sum, g) => sum + g.goals + g.assists, 0) / secondHalf.length
      : 0;

  const trend = avgSecondHalf - avgFirstHalf;
  const trendPercent =
    avgFirstHalf > 0 ? ((trend / avgFirstHalf) * 100).toFixed(0) : '0';

  // Calculate stats
  const totalGoals = recentGames.reduce((sum, g) => sum + g.goals, 0);
  const totalAssists = recentGames.reduce((sum, g) => sum + g.assists, 0);
  const avgGoalsPerGame = (totalGoals / recentGames.length).toFixed(1);
  const avgAssistsPerGame = (totalAssists / recentGames.length).toFixed(1);

  return (
    <Card className="border-zinc-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Performance Trends</CardTitle>
          <div className="flex items-center gap-1 text-sm">
            {trend > 0.1 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">+{trendPercent}%</span>
              </>
            ) : trend < -0.1 ? (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">{trendPercent}%</span>
              </>
            ) : (
              <>
                <Minus className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-500 font-medium">Stable</span>
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Last {recentGames.length} games
        </p>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="mt-4 mb-6">
          <div className="flex items-end gap-1 h-32">
            {recentGames.map((game, index) => {
              const contributions = game.goals + game.assists;
              const heightPercent = (contributions / maxContributions) * 100;
              const goalsHeight = contributions > 0 ? (game.goals / contributions) * 100 : 0;

              return (
                <div
                  key={game.id}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-zinc-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      <div className="font-medium">{game.opponent}</div>
                      <div>{new Date(game.date).toLocaleDateString()}</div>
                      <div>
                        {game.goals}G, {game.assists}A
                      </div>
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full rounded-t transition-all duration-300 overflow-hidden"
                    style={{
                      height: `${Math.max(heightPercent, 4)}%`,
                      minHeight: '4px',
                    }}
                  >
                    {/* Goals portion */}
                    <div
                      className="w-full bg-blue-500"
                      style={{ height: `${goalsHeight}%` }}
                    />
                    {/* Assists portion */}
                    <div
                      className="w-full bg-blue-300"
                      style={{ height: `${100 - goalsHeight}%` }}
                    />
                  </div>

                  {/* Result indicator */}
                  <div
                    className={`w-2 h-2 rounded-full ${
                      game.result === 'Win'
                        ? 'bg-green-500'
                        : game.result === 'Loss'
                        ? 'bg-red-500'
                        : 'bg-zinc-400'
                    }`}
                    title={game.result}
                  />
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-zinc-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Goals</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-300 rounded" />
              <span>Assists</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Win</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Loss</span>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200">
          <div>
            <p className="text-xs text-zinc-500">Avg Goals/Game</p>
            <p className="text-lg font-semibold text-zinc-900">{avgGoalsPerGame}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Avg Assists/Game</p>
            <p className="text-lg font-semibold text-zinc-900">{avgAssistsPerGame}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
