'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Scale, Check, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarColor } from '@/lib/player-utils';
import { format } from 'date-fns';

interface PlayerOption {
  id: string;
  name: string;
}

interface BiometricLog {
  id: string;
  date: string;
  restingHeartRate: number | null;
  source: string;
}

interface ChartEntry {
  label: string;
  hr: number;
}

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '12px',
};

function hrCategory(hr: number): { label: string; color: string } {
  if (hr <= 60) return { label: 'Athletic range', color: 'text-green-600' };
  if (hr <= 72) return { label: 'Normal range', color: 'text-blue-600' };
  return { label: 'Above average', color: 'text-amber-600' };
}

// ─── Page ─────────────────────────────────────────────────────
export default function BiometricsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [logs, setLogs] = useState<BiometricLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [hr, setHr] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load players on mount
  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((data) => {
        const list: PlayerOption[] = data.players ?? [];
        setPlayers(list);
        if (list.length === 1) setSelectedPlayerId(list[0].id);
      })
      .catch(() => null);
  }, []);

  // Load biometrics logs when player changes
  useEffect(() => {
    if (!selectedPlayerId) return;
    setLoadingLogs(true);
    fetch(`/api/players/${selectedPlayerId}/biometrics?limit=20`)
      .then((r) => r.json())
      .then((data) => setLogs(data.logs ?? []))
      .catch(() => null)
      .finally(() => setLoadingLogs(false));
  }, [selectedPlayerId]);

  const latestHr = logs.find((l) => l.restingHeartRate != null)?.restingHeartRate ?? null;
  const hrInfo = latestHr ? hrCategory(latestHr) : null;

  const chartData: ChartEntry[] = [...logs]
    .reverse()
    .filter((l) => l.restingHeartRate != null)
    .map((l) => ({
      label: format(new Date(l.date), 'MMM d'),
      hr: l.restingHeartRate!,
    }));

  const handleSave = async () => {
    if (!hr || !selectedPlayerId) return;
    const hrVal = parseInt(hr);
    if (isNaN(hrVal) || hrVal < 30 || hrVal > 220) return;

    setSaving(true);
    try {
      await fetch(`/api/players/${selectedPlayerId}/biometrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          source: 'manual',
          restingHeartRate: hrVal,
        }),
      });
      // Reload logs
      const res = await fetch(`/api/players/${selectedPlayerId}/biometrics?limit=20`);
      const data = res.ok ? await res.json() : { logs: [] };
      setLogs(data.logs ?? []);
      setHr('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
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
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">Biometrics</h2>
            <p className="font-body text-sm text-zinc-500">Track resting heart rate over time</p>
          </div>
        </div>
      </motion.div>

      {/* Player selector */}
      {players.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="font-body text-xs text-zinc-500">Viewing:</span>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors',
                selectedPlayerId === p.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              )}
            >
              <div className={cn('w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold', getAvatarColor(p.name))}>
                {getInitials(p.name).charAt(0)}
              </div>
              {p.name}
            </button>
          ))}
        </motion.div>
      )}

      {/* HR summary */}
      {latestHr !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-body text-xs text-zinc-400 mb-1">Resting HR (latest)</p>
            <p className="font-display text-3xl font-semibold text-zinc-900">{latestHr}</p>
            <p className={cn('font-body text-sm font-medium mt-1', hrInfo?.color)}>bpm · {hrInfo?.label}</p>
          </div>
        </motion.div>
      )}

      {/* HR trend chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <h3 className="font-display text-base font-semibold text-zinc-900">Resting HR Trend</h3>
          <p className="font-body text-xs text-zinc-400 mb-4">Last {chartData.length} entries (bpm)</p>
          {mounted ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                  unit=" bpm"
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} bpm`, 'Resting HR']} />
                <Line
                  type="monotone"
                  dataKey="hr"
                  stroke="#ec4899"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#ec4899' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-45 bg-zinc-50 rounded-xl animate-pulse" />
          )}
        </motion.div>
      )}

      {/* Log form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
        className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
      >
        <h3 className="font-display text-base font-semibold text-zinc-700">Log Measurement</h3>

        <div className="max-w-50">
          <label className="block font-body text-xs font-medium text-zinc-600 mb-1.5">
            Resting Heart Rate (bpm)
          </label>
          <input
            type="number"
            value={hr}
            onChange={(e) => { setHr(e.target.value); setSaved(false); }}
            placeholder="e.g. 58"
            min="30"
            max="220"
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 placeholder:text-zinc-300 transition-colors"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!hr || !selectedPlayerId || saving}
          className={cn(
            'w-full py-3 rounded-full font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2',
            saved
              ? 'bg-green-500 text-white'
              : hr && selectedPlayerId
              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
          )}
        >
          {saved ? (
            <><Check size={15} /> Logged!</>
          ) : saving ? (
            <><Loader2 size={15} className="animate-spin" /> Saving…</>
          ) : (
            'Save Measurement'
          )}
        </motion.button>
      </motion.div>

      {/* History table */}
      {(logs.length > 0 || loadingLogs) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-zinc-100">
            <h3 className="font-display text-base font-semibold text-zinc-900">History</h3>
          </div>
          {loadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-75">
                <thead>
                  <tr className="border-b border-zinc-50 bg-zinc-50/60">
                    {['Date', 'Resting HR', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left font-body text-xs font-semibold text-zinc-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const cat = log.restingHeartRate ? hrCategory(log.restingHeartRate) : null;
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-body text-sm font-medium text-zinc-800">
                          {format(new Date(log.date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 font-body text-sm text-zinc-600">
                          {log.restingHeartRate ? `${log.restingHeartRate} bpm` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {cat ? (
                            <span className={cn('font-body text-sm font-medium', cat.color)}>
                              {cat.label}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {!loadingLogs && logs.length === 0 && selectedPlayerId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-8 shadow-sm text-center"
        >
          <p className="font-body text-sm text-zinc-500">No measurements logged yet. Add your first entry above.</p>
        </motion.div>
      )}
    </div>
  );
}
