'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { AIInsightCard } from '@/components/ui/ai-insight-card';

// ─── Mock data ────────────────────────────────────────────────
type Range = '7d' | '30d' | '90d' | 'season';

const RANGE_LABELS: Record<Range, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  season: 'This season',
};

const overviewByRange: Record<Range, { goals: number; assists: number; games: number; winRate: number; prevGoals: number; prevAssists: number; prevGames: number; prevWinRate: number }> = {
  '7d':    { goals: 4,  assists: 2,  games: 2,  winRate: 50, prevGoals: 2,  prevAssists: 1,  prevGames: 2,  prevWinRate: 50 },
  '30d':   { goals: 14, assists: 7,  games: 8,  winRate: 75, prevGoals: 11, prevAssists: 5,  prevGames: 7,  prevWinRate: 71 },
  '90d':   { goals: 33, assists: 18, games: 22, winRate: 73, prevGoals: 28, prevAssists: 14, prevGames: 20, prevWinRate: 70 },
  season:  { goals: 33, assists: 21, games: 27, winRate: 78, prevGoals: 25, prevAssists: 16, prevGames: 22, prevWinRate: 72 },
};

const goalsOverTime: Record<Range, { label: string; goals: number; assists: number }[]> = {
  '7d': [
    { label: 'Mon', goals: 0, assists: 0 },
    { label: 'Tue', goals: 2, assists: 1 },
    { label: 'Wed', goals: 0, assists: 0 },
    { label: 'Thu', goals: 0, assists: 0 },
    { label: 'Fri', goals: 2, assists: 1 },
    { label: 'Sat', goals: 0, assists: 0 },
    { label: 'Sun', goals: 0, assists: 0 },
  ],
  '30d': [
    { label: 'Wk 1', goals: 4, assists: 2 },
    { label: 'Wk 2', goals: 3, assists: 1 },
    { label: 'Wk 3', goals: 5, assists: 3 },
    { label: 'Wk 4', goals: 2, assists: 1 },
  ],
  '90d': [
    { label: 'Jan', goals: 12, assists: 6 },
    { label: 'Feb', goals: 11, assists: 7 },
    { label: 'Mar', goals: 10, assists: 5 },
  ],
  season: [
    { label: 'Oct', goals: 3, assists: 2 },
    { label: 'Nov', goals: 5, assists: 3 },
    { label: 'Dec', goals: 4, assists: 1 },
    { label: 'Jan', goals: 7, assists: 4 },
    { label: 'Feb', goals: 6, assists: 3 },
    { label: 'Mar', goals: 8, assists: 4 },
  ],
};

const goalsByOpponent = [
  { opponent: 'Valley SC', goals: 5, games: 3 },
  { opponent: 'Oak Ridge', goals: 4, games: 2 },
  { opponent: 'Riverside', goals: 6, games: 4 },
  { opponent: 'Crestwood', goals: 3, games: 2 },
  { opponent: 'Lakewood', goals: 2, games: 2 },
  { opponent: 'Hillside', goals: 7, games: 4 },
];

const positionData = [
  { name: 'Forward', value: 18, color: '#f59e0b' },
  { name: 'Midfielder', value: 10, color: '#3b82f6' },
  { name: 'Defender', value: 3, color: '#22c55e' },
  { name: 'Wing', value: 2, color: '#a855f7' },
];

const bestGames = [
  { opponent: 'Valley SC', date: 'Feb 22, 2026', goals: 3, assists: 1, result: 'W 4-1' },
  { opponent: 'Hillside FC', date: 'Mar 8, 2026', goals: 2, assists: 2, result: 'W 5-2' },
];

const worstGames = [
  { opponent: 'Lakewood', date: 'Jan 10, 2026', goals: 0, assists: 0, result: 'L 0-2' },
  { opponent: 'Crestwood', date: 'Nov 14, 2025', goals: 0, assists: 1, result: 'D 1-1' },
];

const athleteComparison = [
  { name: 'Marcus O.', position: 'Forward', goals: 33, assists: 21, games: 27, winRate: '78%' },
  { name: 'Jamie K.', position: 'Midfielder', goals: 8, assists: 19, games: 26, winRate: '77%' },
  { name: 'Leo M.', position: 'Defender', goals: 2, assists: 4, games: 25, winRate: '80%' },
  { name: 'Aiden P.', position: 'Forward', goals: 21, assists: 11, games: 24, winRate: '75%' },
];

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '12px',
};

// ─── Stat card ────────────────────────────────────────────────
function StatCard({
  label,
  value,
  prev,
  unit = '',
  delay = 0,
}: {
  label: string;
  value: number;
  prev: number;
  unit?: string;
  delay?: number;
}) {
  const diff = value - prev;
  const dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-5 shadow-sm"
    >
      <p className="font-body text-xs text-zinc-400 mb-1">{label}</p>
      <p className="font-display text-3xl font-semibold text-zinc-900">
        {value}
        {unit}
      </p>
      <div
        className={cn(
          'flex items-center gap-1 mt-1.5 font-body text-xs font-medium',
          dir === 'up' ? 'text-green-600' : dir === 'down' ? 'text-red-500' : 'text-zinc-400'
        )}
      >
        {dir === 'up' ? (
          <TrendingUp size={12} />
        ) : dir === 'down' ? (
          <TrendingDown size={12} />
        ) : (
          <Minus size={12} />
        )}
        <span>
          {diff > 0 ? '+' : ''}
          {diff}
          {unit} vs prior period
        </span>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [range, setRange] = useState<Range>('season');
  const overview = overviewByRange[range];
  const timelineData = goalsOverTime[range];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header + date range */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h2 className="font-display text-2xl font-semibold text-zinc-900">Analytics</h2>
          <p className="font-body text-sm text-zinc-500">Performance insights across your squad</p>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto scrollbar-none shrink-0">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-colors whitespace-nowrap',
                range === r ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Goals" value={overview.goals} prev={overview.prevGoals} delay={0.04} />
        <StatCard label="Assists" value={overview.assists} prev={overview.prevAssists} delay={0.07} />
        <StatCard label="Games" value={overview.games} prev={overview.prevGames} delay={0.1} />
        <StatCard label="Win Rate" value={overview.winRate} prev={overview.prevWinRate} unit="%" delay={0.13} />
      </div>

      {/* AI performance insights — key forces remount (and idle reset) on range switch */}
      <AIInsightCard
        key={range}
        type="analytics"
        title="AI Performance Insights"
        context={{
          goals:   overview.goals,
          assists: overview.assists,
          games:   overview.games,
          winRate: overview.winRate,
          range:   RANGE_LABELS[range],
        }}
      />

      {/* Goals over time */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl p-5 shadow-sm"
      >
        <h3 className="font-display text-base font-semibold text-zinc-900">Goals &amp; Assists Over Time</h3>
        <p className="font-body text-xs text-zinc-400 mb-4">{RANGE_LABELS[range]}</p>
        {mounted ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
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

      {/* Goals by opponent + Position pie */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-5">
        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h3 className="font-display text-base font-semibold text-zinc-900">Goals by Opponent</h3>
          <p className="font-body text-xs text-zinc-400 mb-4">Season totals</p>
          {mounted ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={goalsByOpponent} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis
                  dataKey="opponent"
                  tick={{ fontSize: 10, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="goals" name="Goals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] bg-zinc-50 rounded-xl animate-pulse" />
          )}
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h3 className="font-display text-base font-semibold text-zinc-900">Goals by Position</h3>
          <p className="font-body text-xs text-zinc-400 mb-2">Season breakdown</p>
          {mounted ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={positionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {positionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {positionData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: entry.color }}
                      />
                      <span className="font-body text-xs text-zinc-600">{entry.name}</span>
                    </div>
                    <span className="font-display text-xs font-semibold text-zinc-900">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[220px] bg-zinc-50 rounded-xl animate-pulse" />
          )}
        </motion.div>
      </div>

      {/* Best / worst games */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.21 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={15} className="text-amber-500" fill="#f59e0b" />
            <h3 className="font-display text-base font-semibold text-zinc-900">Best Games</h3>
          </div>
          <div className="space-y-3">
            {bestGames.map((g) => (
              <div key={g.date} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <div>
                  <p className="font-display text-sm font-semibold text-zinc-900">vs {g.opponent}</p>
                  <p className="font-body text-xs text-zinc-400">{g.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-semibold text-amber-600">{g.result}</p>
                  <p className="font-body text-xs text-zinc-500">
                    {g.goals}G · {g.assists}A
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.23 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-zinc-400" />
            <h3 className="font-display text-base font-semibold text-zinc-900">Worst Games</h3>
          </div>
          <div className="space-y-3">
            {worstGames.map((g) => (
              <div key={g.date} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                <div>
                  <p className="font-display text-sm font-semibold text-zinc-900">vs {g.opponent}</p>
                  <p className="font-body text-xs text-zinc-400">{g.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-semibold text-red-500">{g.result}</p>
                  <p className="font-body text-xs text-zinc-500">
                    {g.goals}G · {g.assists}A
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Athlete comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-zinc-100">
          <h3 className="font-display text-base font-semibold text-zinc-900">Athlete Comparison</h3>
          <p className="font-body text-xs text-zinc-400">Season totals across all athletes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-zinc-50 bg-zinc-50/60">
                {['Athlete', 'Position', 'Goals', 'Assists', 'Games', 'Win Rate'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left font-body text-xs font-semibold text-zinc-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {athleteComparison.map((athlete, i) => (
                <tr
                  key={athlete.name}
                  className={cn(
                    'border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors',
                    i === 0 && 'bg-amber-50/30'
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="font-display text-xs font-semibold text-amber-700">
                          {athlete.name.split(' ')[0][0]}
                        </span>
                      </div>
                      <span className="font-body text-sm font-medium text-zinc-800">
                        {athlete.name}
                      </span>
                      {i === 0 && (
                        <span className="font-body text-[10px] font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-zinc-500">{athlete.position}</td>
                  <td className="px-5 py-3 font-display text-sm font-semibold text-amber-600">
                    {athlete.goals}
                  </td>
                  <td className="px-5 py-3 font-display text-sm font-semibold text-blue-600">
                    {athlete.assists}
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-zinc-600">{athlete.games}</td>
                  <td className="px-5 py-3 font-display text-sm font-semibold text-green-600">
                    {athlete.winRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
