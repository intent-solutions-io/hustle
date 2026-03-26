'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Scale, Check } from 'lucide-react';
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

// ─── Mock data ────────────────────────────────────────────────
interface BiometricEntry {
  date: string;
  height: number;
  weight: number;
  hr: number;
}

const initialEntries: BiometricEntry[] = [
  { date: 'Oct 2025', height: 168.0, weight: 62.5, hr: 58 },
  { date: 'Nov 2025', height: 168.0, weight: 63.0, hr: 57 },
  { date: 'Dec 2025', height: 168.5, weight: 63.5, hr: 56 },
  { date: 'Jan 2026', height: 169.0, weight: 64.0, hr: 56 },
  { date: 'Feb 2026', height: 169.0, weight: 63.5, hr: 55 },
  { date: 'Mar 2026', height: 169.5, weight: 63.8, hr: 55 },
];

function calcBmi(weight: number, height: number): number {
  return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-600' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-600' };
  return { label: 'Obese', color: 'text-red-600' };
}

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '12px',
};

// ─── Page ─────────────────────────────────────────────────────
export default function BiometricsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [entries, setEntries] = useState<BiometricEntry[]>(initialEntries);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [hr, setHr] = useState('');
  const [saved, setSaved] = useState(false);

  const latest = entries[entries.length - 1];
  const bmi = calcBmi(latest.weight, latest.height);
  const bmiInfo = bmiCategory(bmi);

  const handleSave = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h < 100 || h > 250 || w < 20 || w > 200) return;
    const newEntry: BiometricEntry = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      height: h,
      weight: w,
      hr: parseInt(hr) || 0,
    };
    setEntries((prev) => [...prev, newEntry]);
    setHeight('');
    setWeight('');
    setHr('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
            <p className="font-body text-sm text-zinc-500">Track height, weight, and heart rate</p>
          </div>
        </div>
      </motion.div>

      {/* BMI + HR summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-body text-xs text-zinc-400 mb-1">BMI (latest)</p>
          <p className="font-display text-3xl font-semibold text-zinc-900">{bmi}</p>
          <p className={cn('font-body text-sm font-medium mt-1', bmiInfo.color)}>
            {bmiInfo.label}
          </p>
          <p className="font-body text-xs text-zinc-400 mt-1">
            {latest.height} cm · {latest.weight} kg
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-body text-xs text-zinc-400 mb-1">Resting HR (latest)</p>
          <p className="font-display text-3xl font-semibold text-zinc-900">{latest.hr}</p>
          <p className="font-body text-sm font-medium text-blue-600 mt-1">bpm</p>
          <p className="font-body text-xs text-zinc-400 mt-1">
            {latest.hr <= 60 ? 'Athletic range' : latest.hr <= 72 ? 'Normal range' : 'Above average'}
          </p>
        </div>
      </motion.div>

      {/* Weight trend chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white rounded-2xl p-5 shadow-sm"
      >
        <h3 className="font-display text-base font-semibold text-zinc-900">Weight Trend</h3>
        <p className="font-body text-xs text-zinc-400 mb-4">Last {entries.length} entries (kg)</p>
        {mounted ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={entries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                unit=" kg"
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, 'Weight']} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#ec4899' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] bg-zinc-50 rounded-xl animate-pulse" />
        )}
      </motion.div>

      {/* Log form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
        className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
      >
        <h3 className="font-display text-base font-semibold text-zinc-700">Log Measurement</h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Height (cm)', value: height, setter: setHeight, placeholder: '169.5', min: '100', max: '250' },
            { label: 'Weight (kg)', value: weight, setter: setWeight, placeholder: '63.8', min: '20', max: '200' },
            { label: 'Resting HR', value: hr, setter: setHr, placeholder: '55', min: '30', max: '120' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block font-body text-xs font-medium text-zinc-600 mb-1.5">
                {field.label}
              </label>
              <input
                type="number"
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step="0.1"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 placeholder:text-zinc-300 transition-colors"
              />
            </div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!height || !weight}
          className={cn(
            'w-full py-3 rounded-full font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2',
            saved
              ? 'bg-green-500 text-white'
              : height && weight
              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
          )}
        >
          {saved ? (
            <>
              <Check size={15} /> Logged!
            </>
          ) : (
            'Save Measurement'
          )}
        </motion.button>
      </motion.div>

      {/* History table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-zinc-100">
          <h3 className="font-display text-base font-semibold text-zinc-900">History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-zinc-50 bg-zinc-50/60">
                {['Date', 'Height', 'Weight', 'BMI', 'Resting HR'].map((h) => (
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
              {[...entries].reverse().map((entry, i) => {
                const entryBmi = calcBmi(entry.weight, entry.height);
                const cat = bmiCategory(entryBmi);
                return (
                  <tr
                    key={i}
                    className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-body text-sm font-medium text-zinc-800">
                      {entry.date}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-zinc-600">{entry.height} cm</td>
                    <td className="px-4 py-3 font-body text-sm text-zinc-600">{entry.weight} kg</td>
                    <td className="px-4 py-3">
                      <span className={cn('font-body text-sm font-medium', cat.color)}>
                        {entryBmi}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-zinc-600">
                      {entry.hr ? `${entry.hr} bpm` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
