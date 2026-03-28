'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Target,
  Handshake,
  Shield,
  AlertTriangle,
  Trophy,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ResultBadge } from '@/components/ui/result-badge';
import { PositionBadge } from '@/components/ui/position-badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import { staggerContainer, staggerItem } from '@/lib/animation';
import { getInitials, getAvatarColor, calculateAge } from '@/lib/player-utils';
import { cn } from '@/lib/utils';

interface PlayerData {
  id: string;
  name: string;
  birthday: string;
  gender: string;
  position: string;
  primaryPosition?: string;
  teamClub?: string;
  leagueCode?: string;
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AthleteDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [athlete, setAthlete] = useState<PlayerData | null>(null);
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch all players and find this one
        const pRes = await fetch('/api/players');
        if (!pRes.ok) throw new Error('Failed to fetch players');
        const pData = await pRes.json();
        const found = (pData.players ?? []).find((p: PlayerData) => p.id === id);
        setAthlete(found ?? null);

        if (found) {
          const gRes = await fetch(`/api/games?playerId=${id}`);
          if (gRes.ok) {
            const gData = await gRes.json();
            setGames(gData.games ?? []);
          }
        }
      } catch (err) {
        console.error('Failed to load athlete:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-5xl mb-4">⚽</div>
        <h3 className="font-display text-xl font-semibold text-zinc-900 mb-2">
          Athlete not found
        </h3>
        <Link href="/dashboard/athletes" className="text-amber-600 hover:underline font-body text-sm">
          Back to Athletes
        </Link>
      </div>
    );
  }

  const posCode = athlete.primaryPosition ?? athlete.position;
  const wins = games.filter((g) => g.result === 'win').length;
  const winRate = games.length > 0 ? wins / games.length : 0;
  const totalGoals = games.reduce((s, g) => s + g.goals, 0);
  const totalAssists = games.reduce((s, g) => s + g.assists, 0);
  const totalMinutes = games.reduce((s, g) => s + g.minutesPlayed, 0);

  const sortedGames = [...games].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDelete = async () => {
    if (!confirm(`Remove ${athlete.name} from your athletes?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/athletes');
      } else {
        alert('Failed to delete athlete. Please try again.');
        setDeleting(false);
      }
    } catch {
      alert('Failed to delete athlete. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Back */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Link
          href="/dashboard/athletes"
          className="inline-flex items-center gap-1.5 font-body text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ChevronLeft size={15} />
          Athletes
        </Link>
      </motion.div>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-white rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display font-semibold text-3xl shrink-0',
                getAvatarColor(athlete.name)
              )}
            >
              {getInitials(athlete.name)}
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-zinc-900">
                {athlete.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <PositionBadge position={posCode} />
                <span className="font-body text-sm text-zinc-500">
                  Age {calculateAge(new Date(athlete.birthday))}
                </span>
              </div>
              <p className="font-body text-sm text-zinc-500 mt-1">
                {athlete.teamClub ?? ''}
                {athlete.leagueCode && (
                  <span className="text-zinc-400"> · {athlete.leagueCode}</span>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dashboard/athletes/${athlete.id}/edit`}>
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-body text-sm font-medium transition-colors cursor-pointer"
              >
                <Edit2 size={14} />
                Edit
              </motion.span>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-body text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting...' : 'Delete'}
            </motion.button>
          </div>
        </div>

        {/* Bio row */}
        <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Calendar size={14} />
            <span className="font-body text-sm">
              Born {format(new Date(athlete.birthday), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Trophy size={14} />
            <span className="font-body text-sm">{posCode}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: 'Games', value: games.length, icon: Trophy, color: 'text-amber-500' },
          { label: 'Goals', value: totalGoals, icon: Target, color: 'text-green-500' },
          { label: 'Assists', value: totalAssists, icon: Handshake, color: 'text-blue-500' },
          { label: 'Minutes', value: totalMinutes, icon: Clock, color: 'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            variants={staggerItem}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <div className={cn('flex justify-center mb-2', color)}>
              <Icon size={20} />
            </div>
            <p className="font-display text-3xl font-semibold text-zinc-900">{value}</p>
            <p className="font-body text-xs text-zinc-400 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Win rate row */}
      {games.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-5"
          >
            <ProgressRing
              progress={winRate}
              size={80}
              strokeWidth={8}
              label="Win Rate"
              color="amber"
            />
            <div>
              <p className="font-display text-base font-semibold text-zinc-900 mb-2">
                Season Record
              </p>
              <div className="flex gap-3 text-sm">
                {[
                  { label: 'W', count: wins, color: 'text-green-600' },
                  {
                    label: 'D',
                    count: games.filter((g) => g.result === 'draw').length,
                    color: 'text-zinc-500',
                  },
                  {
                    label: 'L',
                    count: games.filter((g) => g.result === 'loss').length,
                    color: 'text-red-500',
                  },
                ].map(({ label, count, color }) => (
                  <div key={label} className="text-center">
                    <p className={cn('font-display text-xl font-semibold', color)}>{count}</p>
                    <p className="font-body text-xs text-zinc-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recent games */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-zinc-900">
            Game History
          </h3>
          <Link
            href="/dashboard/log-game"
            className="font-body text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            + Log Game
          </Link>
        </div>

        {sortedGames.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-body text-sm text-zinc-500">
              No games logged yet.{' '}
              <Link href="/dashboard/log-game" className="text-amber-600 hover:underline">
                Log the first game
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedGames.map((game, i) => {
              const scoreparts = game.finalScore?.split('-') ?? [];
              const homeScore = scoreparts[0] ?? '0';
              const awayScore = scoreparts[1] ?? '0';

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, delay: 0.22 + i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 text-center shrink-0">
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
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <ResultBadge result={game.result} size="sm" />
                    <span className="font-display text-sm font-semibold text-zinc-900 w-10 text-center">
                      {homeScore}–{awayScore}
                    </span>
                    <div className="hidden sm:flex items-center gap-2 text-xs font-body text-zinc-500">
                      <span><strong className="text-zinc-700">{game.goals}</strong>G</span>
                      <span><strong className="text-zinc-700">{game.assists}</strong>A</span>
                      <span><strong className="text-zinc-700">{game.minutesPlayed}</strong>min</span>
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
