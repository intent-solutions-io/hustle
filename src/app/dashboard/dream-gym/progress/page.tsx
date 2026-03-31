'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, BarChart3, TrendingUp, TrendingDown, Minus, Star, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ProgressRing } from '@/components/ui/progress-ring';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '12px',
};

interface MonthlyEntry {
  month: string;
  goals: number;
  assists: number;
  games: number;
  winRate: number;
}

interface PersonalBests {
  goalsInGame: number;
  assistsInGame: number;
  totalGoalsSeason: number;
  totalAssistsSeason: number;
}

interface AnalyticsData {
  monthlyData: MonthlyEntry[];
  personalBests: PersonalBests;
  overview: {
    goals: number;
    assists: number;
    games: number;
    winRate: number;
    workouts: number;
    practices: number;
  };
}

const SEASON_TARGETS = {
  goals: 40,
  assists: 30,
  winRate: 80,
  games: 30,
};

// ─── Page ─────────────────────────────────────────────────────
export default function ProgressPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics?range=season')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const monthlyData: MonthlyEntry[] = data?.monthlyData ?? [];
  const pb = data?.personalBests;
  const overview = data?.overview;

  const thisMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;
  const lastMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  const comparisons = thisMonth && lastMonth ? [
    { label: 'Goals',    current: thisMonth.goals,    prev: lastMonth.goals },
    { label: 'Assists',  current: thisMonth.assists,  prev: lastMonth.assists },
    { label: 'Games',    current: thisMonth.games,    prev: lastMonth.games },
    { label: 'Win Rate', current: thisMonth.winRate,  prev: lastMonth.winRate, unit: '%' },
  ] : [];

  const seasonTargets = [
    { label: 'Goals',    current: overview?.goals    ?? 0, target: SEASON_TARGETS.goals },
    { label: 'Assists',  current: overview?.assists  ?? 0, target: SEASON_TARGETS.assists },
    { label: 'Win Rate', current: overview?.winRate  ?? 0, target: SEASON_TARGETS.winRate, unit: '%' },
    { label: 'Games',    current: overview?.games    ?? 0, target: SEASON_TARGETS.games },
  ];

  const personalBests = pb ? [
    { label: 'Goals in a game',   value: pb.goalsInGame },
    { label: 'Assists in a game', value: pb.assistsInGame },
    { label: 'Goals this season', value: pb.totalGoalsSeason },
    { label: 'Assists this season', value: pb.totalAssistsSeason },
  ] : [];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/dashboard/dream-gym"
          className="inline-flex items-center gap-1.5 font-body text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
        >
          <ChevronLeft size={15} />
          Dream Gym
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">Progress</h2>
            <p className="font-body text-sm text-zinc-500">Track your performance over time</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {/* Month comparison cards */}
          {comparisons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {comparisons.map((stat) => {
                const diff = stat.current - stat.prev;
                const dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
                return (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="font-body text-xs text-zinc-400 mb-1">{stat.label}</p>
                    <p className="font-display text-2xl font-semibold text-zinc-900">
                      {stat.current}{stat.unit}
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-1 mt-1 font-body text-xs font-medium',
                        dir === 'up' ? 'text-green-600' : dir === 'down' ? 'text-red-500' : 'text-zinc-400'
                      )}
                    >
                      {dir === 'up' ? <TrendingUp size={11} /> : dir === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
                      <span>
                        {diff > 0 ? '+' : ''}{diff}{stat.unit} vs last mo.
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Goals & Assists chart */}
          {monthlyData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <h3 className="font-display text-base font-semibold text-zinc-900">Goals & Assists</h3>
              <p className="font-body text-xs text-zinc-400 mb-4">Monthly breakdown</p>
              {mounted ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Line
                      type="monotone"
                      dataKey="goals"
                      name="Goals"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#f59e0b' }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="assists"
                      name="Assists"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#3b82f6' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-50 bg-zinc-50 rounded-xl animate-pulse" />
              )}
            </motion.div>
          )}

          {/* Win Rate chart */}
          {monthlyData.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.11 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <h3 className="font-display text-base font-semibold text-zinc-900">Win Rate Trend</h3>
              <p className="font-body text-xs text-zinc-400 mb-4">Monthly win rate</p>
              {mounted ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#a1a1aa' }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v) => [`${v}%`, 'Win Rate']}
                    />
                    <Line
                      type="monotone"
                      dataKey="winRate"
                      name="Win Rate"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#22c55e' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-45 bg-zinc-50 rounded-xl animate-pulse" />
              )}
            </motion.div>
          )}

          {/* Personal bests */}
          {personalBests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Star size={16} className="text-amber-500" fill="#f59e0b" />
                <h3 className="font-display text-base font-semibold text-zinc-900">Personal Bests</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {personalBests.map((pb) => (
                  <div key={pb.label} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50">
                    <p className="font-display text-2xl font-semibold text-amber-600 shrink-0">
                      {pb.value}
                    </p>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold text-zinc-900">{pb.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Season targets */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            className="bg-white rounded-2xl p-5 shadow-sm pb-8"
          >
            <h3 className="font-display text-base font-semibold text-zinc-900 mb-5">
              Season Targets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {seasonTargets.map((t) => (
                <div key={t.label} className="flex flex-col items-center gap-2">
                  <ProgressRing
                    progress={t.target > 0 ? Math.min(1, t.current / t.target) * 100 : 0}
                    size={72}
                    strokeWidth={7}
                    label={t.label}
                    color="amber"
                  />
                  <p className="font-body text-xs text-zinc-500 text-center">
                    {t.current}{t.unit ?? ''} / {t.target}{t.unit ?? ''}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Empty state */}
          {(overview?.games ?? 0) === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-12 shadow-sm text-center"
            >
              <p className="text-3xl mb-3">📈</p>
              <p className="font-display text-base font-semibold text-zinc-900 mb-1">No data yet</p>
              <p className="font-body text-sm text-zinc-500">Log some games to see your progress.</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
