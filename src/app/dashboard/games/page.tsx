'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Trophy,
  TrendingUp,
  Target,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { ResultBadge } from '@/components/ui/result-badge';
import { StatCard } from '@/components/ui/stat-card';
import { staggerContainer, staggerItem } from '@/lib/animation';
import { mockGames, mockAthletes } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type FilterResult = 'all' | 'win' | 'loss' | 'draw';
type FilterAthlete = 'all' | string;

export default function GamesPage() {
  const [resultFilter, setResultFilter] = useState<FilterResult>('all');
  const [athleteFilter, setAthleteFilter] = useState<FilterAthlete>('all');

  const filtered = mockGames.filter((g) => {
    if (resultFilter !== 'all' && g.result !== resultFilter) return false;
    if (athleteFilter !== 'all' && g.athleteId !== athleteFilter) return false;
    return true;
  });

  const wins = mockGames.filter((g) => g.result === 'win').length;
  const losses = mockGames.filter((g) => g.result === 'loss').length;
  const draws = mockGames.filter((g) => g.result === 'draw').length;
  const totalGoals = mockGames.reduce((s, g) => s + g.goals, 0);
  const winRate = mockGames.length > 0 ? Math.round((wins / mockGames.length) * 100) : 0;

  const sortedGames = [...filtered].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-2xl font-semibold text-zinc-900">Games</h2>
          <p className="font-body text-sm text-zinc-500 mt-0.5">
            {mockGames.length} games across {mockAthletes.length} athletes
          </p>
        </div>
        <Link href="/dashboard/log-game">
          <motion.span
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white font-display font-semibold text-sm px-4 py-2.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Plus size={16} />
            Log Game
          </motion.span>
        </Link>
      </motion.div>

      {/* Summary stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Total Games"
          value={mockGames.length}
          icon={<Trophy size={18} />}
          accent
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          trend={{ value: wins, direction: 'up', suffix: 'wins' }}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Total Goals"
          value={totalGoals}
          trend={{ value: losses, direction: 'down', suffix: 'losses' }}
          icon={<Target size={18} />}
        />
        <StatCard
          label="W / D / L"
          value={`${wins}–${draws}–${losses}`}
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-zinc-400" />
          <span className="font-body text-sm text-zinc-500">Filter:</span>
        </div>

        {/* Result filter */}
        <div className="flex items-center gap-1.5">
          {(['all', 'win', 'loss', 'draw'] as FilterResult[]).map((r) => (
            <button
              key={r}
              onClick={() => setResultFilter(r)}
              className={cn(
                'px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors',
                resultFilter === r
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100'
              )}
            >
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
            </button>
          ))}
        </div>

        {/* Athlete filter */}
        <div className="relative">
          <select
            value={athleteFilter}
            onChange={(e) => setAthleteFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-zinc-200 rounded-full font-body text-xs font-medium text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
          >
            <option value="all">All Athletes</option>
            {mockAthletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
        </div>

        {(resultFilter !== 'all' || athleteFilter !== 'all') && (
          <button
            onClick={() => { setResultFilter('all'); setAthleteFilter('all'); }}
            className="font-body text-xs text-amber-600 hover:text-amber-700 transition-colors"
          >
            Clear filters
          </button>
        )}
      </motion.div>

      {/* Games table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/60">
          {['Date', 'Opponent', 'Athlete', 'Score', 'Stats', 'Result'].map((h) => (
            <span key={h} className="font-body text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {sortedGames.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⚽</div>
            <p className="font-display text-base font-semibold text-zinc-900 mb-1">
              No games found
            </p>
            <p className="font-body text-sm text-zinc-500">
              {resultFilter !== 'all' || athleteFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Log your first game to get started.'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {sortedGames.map((game) => (
              <motion.div
                key={game.id}
                variants={staggerItem}
                className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr] gap-3 sm:gap-4 px-5 py-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors"
              >
                {/* Date */}
                <div>
                  <p className="font-body text-sm font-medium text-zinc-800">
                    {format(game.date, 'MMM d, yyyy')}
                  </p>
                  <p className="font-body text-xs text-zinc-400 sm:hidden">
                    vs {game.opponent}
                  </p>
                </div>

                {/* Opponent */}
                <p className="hidden sm:block font-body text-sm text-zinc-800">
                  vs {game.opponent}
                </p>

                {/* Athlete */}
                <p className="font-body text-sm text-zinc-600 sm:block">
                  <span className="sm:hidden font-medium">Athlete: </span>
                  {game.athleteName}
                </p>

                {/* Score */}
                <p className="font-display text-sm font-semibold text-zinc-900">
                  <span className="sm:hidden text-zinc-400 font-body font-normal">Score: </span>
                  {game.score.home}–{game.score.away}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-2 text-xs font-body text-zinc-500">
                  <span>
                    <strong className="text-zinc-700">{game.goals}</strong>G
                  </span>
                  <span>
                    <strong className="text-zinc-700">{game.assists}</strong>A
                  </span>
                  <span>
                    <strong className="text-zinc-700">{game.minutesPlayed}</strong>′
                  </span>
                </div>

                {/* Result */}
                <div className="flex items-center gap-2">
                  <ResultBadge result={game.result} size="sm" />
                  {!game.verified && (
                    <span className="hidden sm:block font-body text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      unverified
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Count */}
      {sortedGames.length > 0 && (
        <p className="font-body text-xs text-zinc-400 text-center">
          Showing {sortedGames.length} of {mockGames.length} games
        </p>
      )}
    </div>
  );
}
