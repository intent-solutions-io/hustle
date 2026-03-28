'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Target,
  Handshake,
  Trophy,
  TrendingUp,
  ChevronRight,
  Dumbbell,
  Plus,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ResultBadge } from '@/components/ui/result-badge';
import { PositionBadge } from '@/components/ui/position-badge';
import { staggerContainer, staggerItem } from '@/lib/animation';
import { AIInsightCard } from '@/components/ui/ai-insight-card';
import { getInitials, getAvatarColor } from '@/lib/player-utils';
import { cn } from '@/lib/utils';

interface PlayerData {
  id: string;
  name: string;
  position: string;
  primaryPosition?: string;
  teamClub?: string;
  photoUrl?: string | null;
}

interface GameData {
  id: string;
  date: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  finalScore?: string;
  goals: number;
  assists: number;
  minutesPlayed: number;
  player?: { name: string; position: string };
}

export default function DashboardPage() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [allGames, setAllGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch players
        const playersRes = await fetch('/api/players');
        const playersData = playersRes.ok ? await playersRes.json() : { players: [] };
        const fetchedPlayers: PlayerData[] = playersData.players ?? [];
        setPlayers(fetchedPlayers);

        // Fetch games for each player
        const gamesPromises = fetchedPlayers.map(async (p) => {
          const res = await fetch(`/api/games?playerId=${p.id}`);
          if (!res.ok) return [];
          const data = await res.json();
          return (data.games ?? []) as GameData[];
        });
        const gamesArrays = await Promise.all(gamesPromises);
        setAllGames(gamesArrays.flat());
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute stats from real data
  const totalGoals = allGames.reduce((s, g) => s + g.goals, 0);
  const totalAssists = allGames.reduce((s, g) => s + g.assists, 0);
  const gamesPlayed = allGames.length;
  const wins = allGames.filter((g) => g.result === 'win').length;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  // This month stats
  const now = new Date();
  const thisMonth = allGames.filter((g) => {
    const d = new Date(g.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const goalsThisMonth = thisMonth.reduce((s, g) => s + g.goals, 0);
  const assistsThisMonth = thisMonth.reduce((s, g) => s + g.assists, 0);
  const gamesThisMonth = thisMonth.length;

  // Recent games sorted by date
  const recentGames = [...allGames]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="font-display text-2xl font-semibold text-zinc-900">
          Good morning 👋
        </h2>
        <p className="font-body text-sm text-zinc-500 mt-0.5">
          {players.length > 0
            ? "Here's your athletes' performance at a glance"
            : 'Add your first athlete to start tracking performance'}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Goals"
          value={totalGoals}
          trend={goalsThisMonth > 0 ? { value: goalsThisMonth, direction: 'up' } : undefined}
          icon={<Target size={18} />}
          accent
        />
        <StatCard
          label="Total Assists"
          value={totalAssists}
          trend={assistsThisMonth > 0 ? { value: assistsThisMonth, direction: 'up' } : undefined}
          icon={<Handshake size={18} />}
        />
        <StatCard
          label="Games Played"
          value={gamesPlayed}
          trend={gamesThisMonth > 0 ? { value: gamesThisMonth, direction: 'neutral', suffix: 'this month' } : undefined}
          icon={<Trophy size={18} />}
        />
        <StatCard
          label="Win Rate"
          value={gamesPlayed > 0 ? `${winRate}%` : '—'}
          icon={<TrendingUp size={18} />}
        />
      </motion.div>

      {/* AI tip of the day */}
      {allGames.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
        >
          <AIInsightCard
            type="tip"
            title="Tip of the Day"
            autoLoad
            context={{
              recentResults: recentGames
                .slice(0, 3)
                .map((g) => `${g.result} vs ${g.opponent} (${g.goals}G ${g.assists}A)`)
                .join(', '),
            }}
          />
        </motion.div>
      )}

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Athletes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-zinc-900">
              Athletes
            </h3>
            <Link
              href="/dashboard/athletes"
              className="font-body text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-body text-sm text-zinc-500 mb-4">
                No athletes yet. Add your first athlete to start tracking.
              </p>
              <Link href="/dashboard/add-athlete">
                <span className="inline-flex items-center gap-2 bg-zinc-900 text-white font-display font-semibold text-sm px-4 py-2.5 rounded-full hover:bg-zinc-800 transition-colors">
                  <Plus size={15} />
                  Add Athlete
                </span>
              </Link>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {players.map((player) => {
                const playerGames = allGames.filter(
                  (g) => g.player?.name === player.name
                );
                const playerGoals = playerGames.reduce((s, g) => s + g.goals, 0);
                const playerAssists = playerGames.reduce((s, g) => s + g.assists, 0);

                return (
                  <motion.div
                    key={player.id}
                    variants={staggerItem}
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7F5F0] transition-colors cursor-pointer"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-display font-semibold shrink-0',
                        getAvatarColor(player.name)
                      )}
                    >
                      {getInitials(player.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-body font-medium text-sm text-zinc-900 truncate">
                          {player.name}
                        </p>
                        <PositionBadge position={player.primaryPosition ?? player.position} />
                      </div>
                      <p className="font-body text-xs text-zinc-500">{player.teamClub ?? ''}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <p className="font-display text-base font-semibold text-zinc-900">
                          {playerGoals}
                        </p>
                        <p className="font-body text-xs text-zinc-400">Goals</p>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-base font-semibold text-zinc-900">
                          {playerAssists}
                        </p>
                        <p className="font-body text-xs text-zinc-400">Assists</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Dream Gym Progress - placeholder until Dream Gym has real data */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-zinc-900">
              Dream Gym
            </h3>
            <Link href="/dashboard/dream-gym">
              <span className="p-1.5 bg-amber-50 rounded-lg">
                <Dumbbell size={16} className="text-amber-600" />
              </span>
            </Link>
          </div>

          <div className="flex flex-col items-center py-4 space-y-6">
            <ProgressRing
              progress={0}
              size={100}
              strokeWidth={10}
              label="Workouts"
              color="amber"
            />
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-body text-sm text-zinc-600">Workouts</span>
                </div>
                <span className="font-display text-sm font-semibold text-zinc-900">
                  0/0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="font-body text-sm text-zinc-600">Practices</span>
                </div>
                <span className="font-display text-sm font-semibold text-zinc-900">
                  0/0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="font-body text-sm text-zinc-600">Mental</span>
                </div>
                <span className="font-display text-sm font-semibold text-zinc-900">
                  0/0
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Games */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="bg-white rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-zinc-900">
            Recent Games
          </h3>
          <Link
            href="/dashboard/games"
            className="font-body text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {recentGames.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-body text-sm text-zinc-500 mb-4">
              No games logged yet. Log your first game to see stats here.
            </p>
            <Link href="/dashboard/log-game">
              <span className="inline-flex items-center gap-2 bg-zinc-900 text-white font-display font-semibold text-sm px-4 py-2.5 rounded-full hover:bg-zinc-800 transition-colors">
                <Plus size={15} />
                Log Game
              </span>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentGames.map((game, i) => {
              const scoreparts = game.finalScore?.split('-') ?? [];
              const homeScore = scoreparts[0] ?? '0';
              const awayScore = scoreparts[1] ?? '0';

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.25 + i * 0.06 }}
                  whileHover={{ x: 2 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F5F0] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center w-12 shrink-0">
                      <p className="font-body text-xs font-medium text-zinc-700">
                        {format(new Date(game.date), 'MMM d')}
                      </p>
                      <p className="font-body text-xs text-zinc-400">
                        {format(new Date(game.date), 'yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-zinc-900">
                        vs {game.opponent}
                      </p>
                      <p className="font-body text-xs text-zinc-500">
                        {game.player?.name ?? ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <ResultBadge result={game.result} size="sm" />
                    <span className="font-display text-sm font-semibold text-zinc-900 w-12 text-center">
                      {homeScore}–{awayScore}
                    </span>
                    <div className="hidden sm:flex items-center gap-3 text-xs font-body text-zinc-500">
                      <span>
                        <strong className="text-zinc-800">{game.goals}</strong>G
                      </span>
                      <span>
                        <strong className="text-zinc-800">{game.assists}</strong>A
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
