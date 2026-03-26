'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Target,
  Handshake,
  Trophy,
  TrendingUp,
  ChevronRight,
  Dumbbell,
} from 'lucide-react';
import { format } from 'date-fns';
import { StatCard } from '@/components/ui/stat-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ResultBadge } from '@/components/ui/result-badge';
import { PositionBadge } from '@/components/ui/position-badge';
import { staggerContainer, staggerItem } from '@/lib/animation';
import {
  mockAthletes,
  mockGames,
  mockDashboardStats,
  mockDreamGymProgress,
} from '@/lib/mock-data';
import { AIInsightCard } from '@/components/ui/ai-insight-card';
import { getInitials, getAvatarColor } from '@/lib/player-utils';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const dgProgress = mockDreamGymProgress;
  const recentGames = mockGames.slice(0, 4);

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
          Here&apos;s your athletes&apos; performance at a glance
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
          value={stats.totalGoals}
          trend={{ value: stats.goalsThisMonth, direction: 'up' }}
          icon={<Target size={18} />}
          accent
        />
        <StatCard
          label="Total Assists"
          value={stats.totalAssists}
          trend={{ value: stats.assistsThisMonth, direction: 'up' }}
          icon={<Handshake size={18} />}
        />
        <StatCard
          label="Games Played"
          value={stats.gamesPlayed}
          trend={{ value: stats.gamesThisMonth, direction: 'neutral', suffix: 'this month' }}
          icon={<Trophy size={18} />}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          trend={{ value: stats.winRateChange, direction: 'up', suffix: 'pts' }}
          icon={<TrendingUp size={18} />}
        />
      </motion.div>

      {/* AI tip of the day */}
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
            workoutsCompleted: dgProgress.workoutsCompleted,
            workoutsGoal:      dgProgress.workoutsGoal,
            practicesLogged:   dgProgress.practicesLogged,
            recentResults:     recentGames
              .slice(0, 3)
              .map((g) => `${g.result} vs ${g.opponent} (${g.goals}G ${g.assists}A)`)
              .join(', '),
          }}
        />
      </motion.div>

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

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {mockAthletes.map((athlete) => (
              <motion.div
                key={athlete.id}
                variants={staggerItem}
                whileHover={{ x: 2 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7F5F0] transition-colors cursor-pointer"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-display font-semibold shrink-0',
                    getAvatarColor(athlete.name)
                  )}
                >
                  {getInitials(athlete.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body font-medium text-sm text-zinc-900 truncate">
                      {athlete.name}
                    </p>
                    <PositionBadge position={athlete.positionShort} />
                  </div>
                  <p className="font-body text-xs text-zinc-500">{athlete.teamName}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="font-display text-base font-semibold text-zinc-900">
                      {athlete.stats.goals}
                    </p>
                    <p className="font-body text-xs text-zinc-400">Goals</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-base font-semibold text-zinc-900">
                      {athlete.stats.assists}
                    </p>
                    <p className="font-body text-xs text-zinc-400">Assists</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dream Gym Progress */}
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
              progress={dgProgress.workoutsCompleted / dgProgress.workoutsGoal}
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
                  {dgProgress.workoutsCompleted}/{dgProgress.workoutsGoal}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="font-body text-sm text-zinc-600">Practices</span>
                </div>
                <span className="font-display text-sm font-semibold text-zinc-900">
                  {dgProgress.practicesLogged}/{dgProgress.practicesGoal}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="font-body text-sm text-zinc-600">Mental</span>
                </div>
                <span className="font-display text-sm font-semibold text-zinc-900">
                  {dgProgress.mentalSessions}/{dgProgress.mentalGoal}
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

        <div className="space-y-2">
          {recentGames.map((game, i) => (
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
                  <p className="font-body text-xs text-zinc-500">
                    {game.athleteName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ResultBadge result={game.result} size="sm" />
                <span className="font-display text-sm font-semibold text-zinc-900 w-12 text-center">
                  {game.score.home}–{game.score.away}
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
          ))}
        </div>
      </motion.div>
    </div>
  );
}
