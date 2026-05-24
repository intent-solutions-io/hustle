import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { getAllGamesAdmin } from '@/lib/db/queries/games';
import { getWorkoutLogsAdmin } from '@/lib/db/queries/workout-logs';
import { getPracticeLogsAdmin } from '@/lib/db/queries/practice-logs';
import { getPlayersAdmin } from '@/lib/db/queries/players';
import { format } from 'date-fns';

const logger = createLogger('api/analytics');

type Range = '7d' | '30d' | '90d' | 'season';

function getRangeStart(range: Range): Date {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'season': {
      // Season = Aug 1 of current year (or previous year if before Aug)
      const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
      return new Date(year, 7, 1);
    }
  }
}

/**
 * GET /api/analytics?range=7d|30d|90d|season
 * Returns aggregated stats for all players across the given time range.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const rawRange = request.nextUrl.searchParams.get('range') ?? '30d';
    const range: Range = ['7d', '30d', '90d', 'season'].includes(rawRange)
      ? (rawRange as Range)
      : '30d';

    const rangeStart = getRangeStart(range);

    // Fetch players and games in parallel
    const [players, allGames] = await Promise.all([
      getPlayersAdmin(userId),
      getAllGamesAdmin(userId),
    ]);

    // Filter games to time range
    const games = allGames.filter((g) => new Date(g.date) >= rangeStart);

    // Fetch workout + practice logs for all players in parallel
    const [workoutResults, practiceResults] = await Promise.all([
      Promise.all(
        players.map((p) =>
          getWorkoutLogsAdmin(userId, p.id, { startDate: rangeStart, limit: 500 })
            .then((r) => r.logs)
            .catch(() => [] as never[])
        )
      ),
      Promise.all(
        players.map((p) =>
          getPracticeLogsAdmin(userId, p.id, { startDate: rangeStart, limit: 500 })
            .then((r) => r.logs)
            .catch(() => [] as never[])
        )
      ),
    ]);

    const workoutLogs = workoutResults.flat();
    const practiceLogs = practiceResults.flat();

    // Overview stats
    const wins = games.filter((g) => g.result === 'Win').length;
    const overview = {
      goals: games.reduce((s, g) => s + g.goals, 0),
      assists: games.reduce((s, g) => s + (g.assists ?? 0), 0),
      games: games.length,
      wins,
      winRate: games.length > 0 ? Math.round((wins / games.length) * 100) : 0,
      workouts: workoutLogs.length,
      practices: practiceLogs.length,
    };

    // Goals over time — group by week label
    const gamesByLabel = new Map<string, { goals: number; assists: number; date: Date }>();
    for (const g of games) {
      const label = format(new Date(g.date), 'MMM d');
      const existing = gamesByLabel.get(label);
      if (existing) {
        existing.goals += g.goals;
        existing.assists += g.assists ?? 0;
      } else {
        gamesByLabel.set(label, { goals: g.goals, assists: g.assists ?? 0, date: new Date(g.date) });
      }
    }
    const goalsOverTime = Array.from(gamesByLabel.entries())
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([label, data]) => ({ label, goals: data.goals, assists: data.assists }));

    // Goals by opponent
    const opponentMap = new Map<string, { goals: number; games: number }>();
    for (const g of games) {
      const existing = opponentMap.get(g.opponent);
      if (existing) {
        existing.goals += g.goals;
        existing.games += 1;
      } else {
        opponentMap.set(g.opponent, { goals: g.goals, games: 1 });
      }
    }
    const goalsByOpponent = Array.from(opponentMap.entries())
      .map(([opponent, data]) => ({ opponent, goals: data.goals, games: data.games }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10);

    // Best individual game performances
    const toGameSummary = (g: typeof games[0]) => ({
      date: g.date instanceof Date ? g.date.toISOString() : String(g.date),
      opponent: g.opponent,
      goals: g.goals,
      assists: g.assists ?? 0,
      result: g.result,
      finalScore: g.finalScore,
      playerName: (g as { player?: { name: string } }).player?.name ?? '',
    });

    const bestGames = [...games]
      .sort((a, b) => (b.goals + (b.assists ?? 0)) - (a.goals + (a.assists ?? 0)))
      .slice(0, 5)
      .map(toGameSummary);

    const worstGames = [...games]
      .filter((g) => g.result === 'Loss')
      .sort((a, b) => (a.goals + (a.assists ?? 0)) - (b.goals + (b.assists ?? 0)))
      .slice(0, 5)
      .map(toGameSummary);

    // Per-player breakdown
    const playerStats = players.map((p) => {
      const pg = games.filter((g) => (g as { player?: { id: string } }).player?.id === p.id);
      const pgWins = pg.filter((g) => g.result === 'Win').length;
      return {
        id: p.id,
        name: p.name,
        position: p.primaryPosition ?? p.position,
        goals: pg.reduce((s, g) => s + g.goals, 0),
        assists: pg.reduce((s, g) => s + (g.assists ?? 0), 0),
        games: pg.length,
        winRate: pg.length > 0 ? Math.round((pgWins / pg.length) * 100) : 0,
      };
    });

    // Monthly stats for progress page (all-time, not range-filtered)
    const allGamesForMonthly = allGames;
    const monthlyMap = new Map<string, { goals: number; assists: number; games: number; wins: number }>();
    for (const g of allGamesForMonthly) {
      const key = format(new Date(g.date), 'MMM yyyy');
      const existing = monthlyMap.get(key) ?? { goals: 0, assists: 0, games: 0, wins: 0 };
      existing.goals += g.goals;
      existing.assists += g.assists ?? 0;
      existing.games += 1;
      if (g.result === 'Win') existing.wins += 1;
      monthlyMap.set(key, existing);
    }
    const monthlyData = Array.from(monthlyMap.entries())
      .sort((a, b) => {
        const da = new Date(a[0]);
        const db = new Date(b[0]);
        return da.getTime() - db.getTime();
      })
      .map(([month, data]) => ({
        month,
        goals: data.goals,
        assists: data.assists,
        games: data.games,
        winRate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
      }));

    // Personal bests from all-time games
    const personalBests = {
      goalsInGame: Math.max(0, ...allGamesForMonthly.map((g) => g.goals)),
      assistsInGame: Math.max(0, ...allGamesForMonthly.map((g) => g.assists ?? 0)),
      totalGoalsSeason: allGamesForMonthly.reduce((s, g) => s + g.goals, 0),
      totalAssistsSeason: allGamesForMonthly.reduce((s, g) => s + (g.assists ?? 0), 0),
    };

    return NextResponse.json({
      overview,
      goalsOverTime,
      goalsByOpponent,
      bestGames,
      worstGames,
      players: playerStats,
      monthlyData,
      personalBests,
    });
  } catch (error) {
    logger.error('Failed to fetch analytics', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
