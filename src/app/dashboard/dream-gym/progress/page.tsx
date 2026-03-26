'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, BarChart3, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
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

// ─── Mock data ────────────────────────────────────────────────
const monthlyData = [
  { month: 'Oct', goals: 3, assists: 2, games: 4, winRate: 60 },
  { month: 'Nov', goals: 5, assists: 3, games: 5, winRate: 65 },
  { month: 'Dec', goals: 4, assists: 1, games: 3, winRate: 70 },
  { month: 'Jan', goals: 7, assists: 4, games: 6, winRate: 75 },
  { month: 'Feb', goals: 6, assists: 3, games: 5, winRate: 72 },
  { month: 'Mar', goals: 8, assists: 4, games: 4, winRate: 78 },
];

const personalBests = [
  { label: 'Goals in a game', value: 3, detail: 'vs Valley SC — Feb 22, 2026' },
  { label: 'Assists in a game', value: 2, detail: 'vs Oak Ridge FC — Feb 15, 2026' },
  { label: 'Longest win streak', value: 3, detail: 'Feb 15 – Mar 8, 2026' },
  { label: 'Shots on target', value: 7, detail: 'vs Valley SC — Feb 22, 2026' },
];

const seasonTargets = [
  { label: 'Goals', current: 33, target: 40 },
  { label: 'Assists', current: 21, target: 30 },
  { label: 'Win Rate', current: 78, target: 80, unit: '%' },
  { label: 'Games', current: 27, target: 30 },
];

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '12px',
};

// ─── Page ─────────────────────────────────────────────────────
export default function ProgressPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const thisMonth = monthlyData[monthlyData.length - 1];
  const lastMonth = monthlyData[monthlyData.length - 2];

  const comparisons = [
    { label: 'Goals', current: thisMonth.goals, prev: lastMonth.goals },
    { label: 'Assists', current: thisMonth.assists, prev: lastMonth.assists },
    { label: 'Games', current: thisMonth.games, prev: lastMonth.games },
    { label: 'Win Rate', current: thisMonth.winRate, prev: lastMonth.winRate, unit: '%' },
  ];

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

      {/* Month comparison cards */}
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
                {stat.current}
                {stat.unit}
              </p>
              <div
                className={cn(
                  'flex items-center gap-1 mt-1 font-body text-xs font-medium',
                  dir === 'up'
                    ? 'text-green-600'
                    : dir === 'down'
                    ? 'text-red-500'
                    : 'text-zinc-400'
                )}
              >
                {dir === 'up' ? (
                  <TrendingUp size={11} />
                ) : dir === 'down' ? (
                  <TrendingDown size={11} />
                ) : (
                  <Minus size={11} />
                )}
                <span>
                  {diff > 0 ? '+' : ''}
                  {diff}
                  {stat.unit} vs last mo.
                </span>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Goals & Assists chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white rounded-2xl p-5 shadow-sm"
      >
        <h3 className="font-display text-base font-semibold text-zinc-900">Goals & Assists</h3>
        <p className="font-body text-xs text-zinc-400 mb-4">Last 6 months</p>
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
          <div className="h-[200px] bg-zinc-50 rounded-xl animate-pulse" />
        )}
      </motion.div>

      {/* Win Rate chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
        className="bg-white rounded-2xl p-5 shadow-sm"
      >
        <h3 className="font-display text-base font-semibold text-zinc-900">Win Rate Trend</h3>
        <p className="font-body text-xs text-zinc-400 mb-4">Last 6 months</p>
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
                domain={[55, 85]}
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
          <div className="h-[180px] bg-zinc-50 rounded-xl animate-pulse" />
        )}
      </motion.div>

      {/* Personal bests */}
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
                <p className="font-body text-xs text-zinc-500 truncate">{pb.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

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
                progress={t.current / t.target}
                size={72}
                strokeWidth={7}
                label={t.label}
                color="amber"
              />
              <p className="font-body text-xs text-zinc-500 text-center">
                {t.current}
                {t.unit ?? ''} / {t.target}
                {t.unit ?? ''}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
