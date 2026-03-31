'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { AIInsightCard } from '@/components/ui/ai-insight-card';
import { format } from 'date-fns';
import { getInitials, getAvatarColor } from '@/lib/player-utils';

// ─── Types ────────────────────────────────────────────────────
type Range = '7d' | '30d' | '90d' | 'season';

const RANGE_LABELS: Record<Range, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  season: 'This season',
};

interface AnalyticsOverview {
  goals: number;
  assists: number;
  games: number;
  wins: number;
  winRate: number;
  workouts: number;
  practices: number;
}

interface GameSummary {
  date: string;
  opponent: string;
  goals: number;
  assists: number;
  result: string;
  finalScore: string;
  playerName: string;
}

interface PlayerStat {
  id: string;
  name: string;
  position: string;
  goals: number;
  assists: number;
  games: number;
  winRate: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  goalsOverTime: { label: string; goals: number; assists: number }[];
  goalsByOpponent: { opponent: string; goals: number; games: number }[];
  bestGames: GameSummary[];
  worstGames: GameSummary[];
  players: PlayerStat[];
}

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
  unit = '',
  delay = 0,
}: {
  label: string;
  value: number;
  unit?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-5 shadow-sm"
    >
      <p className="font-body text-xs text-zinc-400 mb-1">{label}</p>
      <p className="font-display text-3xl font-semibold text-zinc-900">
        {value}{unit}
      </p>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [range, setRange] = useState<Range>('season');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [range]);

  const overview = data?.overview;
  const timelineData = data?.goalsOverTime ?? [];
  const goalsByOpponent = data?.goalsByOpponent ?? [];
  const bestGames = data?.bestGames ?? [];
  const worstGames = data?.worstGames ?? [];
  const players = data?.players ?? [];

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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Goals" value={overview?.goals ?? 0} delay={0.04} />
            <StatCard label="Assists" value={overview?.assists ?? 0} delay={0.07} />
            <StatCard label="Games" value={overview?.games ?? 0} delay={0.1} />
            <StatCard label="Win Rate" value={overview?.winRate ?? 0} unit="%" delay={0.13} />
          </div>

          {/* AI performance insights */}
          {(overview?.games ?? 0) > 0 && (
            <AIInsightCard
              key={range}
              type="analytics"
              title="AI Performance Insights"
              context={{
                goals:   overview?.goals ?? 0,
                assists: overview?.assists ?? 0,
                games:   overview?.games ?? 0,
                winRate: overview?.winRate ?? 0,
                range:   RANGE_LABELS[range],
              }}
            />
          )}

          {/* Goals over time */}
          {timelineData.length > 0 && (
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
                <div className="h-50 bg-zinc-50 rounded-xl animate-pulse" />
              )}
            </motion.div>
          )}

          {/* Goals by opponent */}
          {goalsByOpponent.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <h3 className="font-display text-base font-semibold text-zinc-900">Goals by Opponent</h3>
              <p className="font-body text-xs text-zinc-400 mb-4">{RANGE_LABELS[range]}</p>
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
                <div className="h-50 bg-zinc-50 rounded-xl animate-pulse" />
              )}
            </motion.div>
          )}

          {/* Best / worst games */}
          {(bestGames.length > 0 || worstGames.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {bestGames.length > 0 && (
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
                      <div key={`${g.date}-${g.opponent}`} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                        <div>
                          <p className="font-display text-sm font-semibold text-zinc-900">vs {g.opponent}</p>
                          <p className="font-body text-xs text-zinc-400">
                            {format(new Date(g.date), 'MMM d, yyyy')}
                            {g.playerName ? ` · ${g.playerName}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-sm font-semibold text-amber-600">{g.result}</p>
                          <p className="font-body text-xs text-zinc-500">{g.goals}G · {g.assists}A</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {worstGames.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.23 }}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={15} className="text-zinc-400" />
                    <h3 className="font-display text-base font-semibold text-zinc-900">Losses</h3>
                  </div>
                  <div className="space-y-3">
                    {worstGames.map((g) => (
                      <div key={`${g.date}-${g.opponent}`} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                        <div>
                          <p className="font-display text-sm font-semibold text-zinc-900">vs {g.opponent}</p>
                          <p className="font-body text-xs text-zinc-400">
                            {format(new Date(g.date), 'MMM d, yyyy')}
                            {g.playerName ? ` · ${g.playerName}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-sm font-semibold text-red-500">{g.result}</p>
                          <p className="font-body text-xs text-zinc-500">{g.goals}G · {g.assists}A</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Athlete comparison table */}
          {players.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-100">
                <h3 className="font-display text-base font-semibold text-zinc-900">Athlete Comparison</h3>
                <p className="font-body text-xs text-zinc-400">{RANGE_LABELS[range]} totals across all athletes</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-125">
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
                    {[...players]
                      .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
                      .map((athlete, i) => (
                        <tr
                          key={athlete.id}
                          className={cn(
                            'border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors',
                            i === 0 && 'bg-amber-50/30'
                          )}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white',
                                getAvatarColor(athlete.name)
                              )}>
                                <span className="font-display text-xs font-semibold">
                                  {getInitials(athlete.name).charAt(0)}
                                </span>
                              </div>
                              <span className="font-body text-sm font-medium text-zinc-800">
                                {athlete.name}
                              </span>
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
                            {athlete.winRate}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && (overview?.games ?? 0) === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-12 shadow-sm text-center"
            >
              <p className="text-3xl mb-3">📊</p>
              <p className="font-display text-base font-semibold text-zinc-900 mb-1">No data yet</p>
              <p className="font-body text-sm text-zinc-500">Log some games to see your analytics.</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
