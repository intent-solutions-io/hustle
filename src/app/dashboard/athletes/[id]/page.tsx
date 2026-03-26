'use client';

import { use } from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { ResultBadge } from '@/components/ui/result-badge';
import { PositionBadge } from '@/components/ui/position-badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import { staggerContainer, staggerItem } from '@/lib/animation';
import { mockAthletes, mockGames } from '@/lib/mock-data';
import { getInitials, getAvatarColor, calculateAge } from '@/lib/player-utils';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AthleteDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const athlete = mockAthletes.find((a) => a.id === id);

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

  const athleteGames = mockGames.filter((g) => g.athleteId === athlete.id);
  const wins = athleteGames.filter((g) => g.result === 'win').length;
  const winRate = athleteGames.length > 0 ? wins / athleteGames.length : 0;
  const totalMinutes = athleteGames.reduce((s, g) => s + g.minutesPlayed, 0);

  const handleDelete = () => {
    // TODO: wire to Firestore delete
    if (confirm(`Remove ${athlete.name} from your athletes?`)) {
      router.push('/dashboard/athletes');
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
                <PositionBadge position={athlete.positionShort} />
                {athlete.jerseyNumber && (
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-body font-medium rounded-full">
                    #{athlete.jerseyNumber}
                  </span>
                )}
                <span className="font-body text-sm text-zinc-500">
                  Age {calculateAge(athlete.dateOfBirth)}
                </span>
              </div>
              <p className="font-body text-sm text-zinc-500 mt-1">
                {athlete.teamName}
                {athlete.league && (
                  <span className="text-zinc-400"> · {athlete.league}</span>
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-body text-sm font-medium transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </motion.button>
          </div>
        </div>

        {/* Bio row */}
        <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Calendar size={14} />
            <span className="font-body text-sm">
              Born {format(athlete.dateOfBirth, 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Trophy size={14} />
            <span className="font-body text-sm">{athlete.position}</span>
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
          { label: 'Games', value: athlete.stats.games, icon: Trophy, color: 'text-amber-500' },
          { label: 'Goals', value: athlete.stats.goals, icon: Target, color: 'text-green-500' },
          { label: 'Assists', value: athlete.stats.assists, icon: Handshake, color: 'text-blue-500' },
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

      {/* Win rate + discipline row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Win rate */}
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
                  count: athleteGames.filter((g) => g.result === 'draw').length,
                  color: 'text-zinc-500',
                },
                {
                  label: 'L',
                  count: athleteGames.filter((g) => g.result === 'loss').length,
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

        {/* Discipline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <p className="font-display text-base font-semibold text-zinc-900 mb-4">
            Discipline
          </p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-8 bg-yellow-400 rounded-sm shadow-sm" />
              <div>
                <p className="font-display text-2xl font-semibold text-zinc-900">
                  {athlete.stats.yellowCards}
                </p>
                <p className="font-body text-xs text-zinc-400">Yellow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-8 bg-red-500 rounded-sm shadow-sm" />
              <div>
                <p className="font-display text-2xl font-semibold text-zinc-900">
                  {athlete.stats.redCards}
                </p>
                <p className="font-body text-xs text-zinc-400">Red</p>
              </div>
            </div>
            {athlete.stats.yellowCards === 0 && athlete.stats.redCards === 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <Shield size={18} />
                <span className="font-body text-sm font-medium">Clean record</span>
              </div>
            )}
            {athlete.stats.yellowCards > 0 && (
              <div className="flex items-center gap-1.5 text-yellow-600 ml-auto">
                <AlertTriangle size={14} />
                <span className="font-body text-xs">
                  {athlete.stats.yellowCards >= 5 ? 'Suspension risk' : 'Caution'}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

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

        {athleteGames.length === 0 ? (
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
            {athleteGames.map((game, i) => (
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
                      {format(game.date, 'MMM d')}
                    </p>
                    <p className="font-body text-xs text-zinc-400">
                      {format(game.date, 'yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-zinc-900">
                      vs {game.opponent}
                    </p>
                    {game.notes && (
                      <p className="font-body text-xs text-zinc-400 truncate max-w-[180px]">
                        {game.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ResultBadge result={game.result} size="sm" />
                  <span className="font-display text-sm font-semibold text-zinc-900 w-10 text-center">
                    {game.score.home}–{game.score.away}
                  </span>
                  <div className="hidden sm:flex items-center gap-2 text-xs font-body text-zinc-500">
                    <span><strong className="text-zinc-700">{game.goals}</strong>G</span>
                    <span><strong className="text-zinc-700">{game.assists}</strong>A</span>
                    <span><strong className="text-zinc-700">{game.minutesPlayed}</strong>min</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
