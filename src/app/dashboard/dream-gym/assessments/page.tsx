'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ClipboardCheck, Check } from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── Data ─────────────────────────────────────────────────────
type Skill = 'Speed' | 'Agility' | 'Strength' | 'Endurance' | 'Technical' | 'Mental';

const SKILL_CONFIGS: Record<
  Skill,
  { emoji: string; desc: string; dotColor: string; textColor: string }
> = {
  Speed:     { emoji: '⚡', desc: 'Sprint pace and acceleration',       dotColor: 'bg-red-500',    textColor: 'text-red-600' },
  Agility:   { emoji: '🤸', desc: 'Change of direction and quickness',  dotColor: 'bg-orange-500', textColor: 'text-orange-600' },
  Strength:  { emoji: '💪', desc: 'Physical power and muscular fitness', dotColor: 'bg-amber-500',  textColor: 'text-amber-600' },
  Endurance: { emoji: '🫁', desc: 'Stamina across 90 minutes',          dotColor: 'bg-cyan-500',   textColor: 'text-cyan-600' },
  Technical: { emoji: '⚽', desc: 'Ball control, passing, finishing',   dotColor: 'bg-blue-500',   textColor: 'text-blue-600' },
  Mental:    { emoji: '🧠', desc: 'Focus, composure, and resilience',   dotColor: 'bg-purple-500', textColor: 'text-purple-600' },
};

const SKILLS = Object.keys(SKILL_CONFIGS) as Skill[];

const mockHistory = [
  { date: 'Jan 2026', Speed: 7, Agility: 6, Strength: 5, Endurance: 7, Technical: 8, Mental: 6 },
  { date: 'Feb 2026', Speed: 7, Agility: 7, Strength: 6, Endurance: 8, Technical: 8, Mental: 6 },
  { date: 'Mar 2026', Speed: 8, Agility: 7, Strength: 6, Endurance: 8, Technical: 9, Mental: 7 },
];

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '12px',
};

// ─── Page ─────────────────────────────────────────────────────
export default function AssessmentsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const latest = mockHistory[mockHistory.length - 1];
  const [ratings, setRatings] = useState<Record<Skill, number>>({
    Speed: latest.Speed,
    Agility: latest.Agility,
    Strength: latest.Strength,
    Endurance: latest.Endurance,
    Technical: latest.Technical,
    Mental: latest.Mental,
  });
  const [saved, setSaved] = useState(false);

  const handleRate = (skill: Skill, value: number) => {
    setRatings((prev) => ({ ...prev, [skill]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    console.log('Save assessment:', ratings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const radarData = SKILLS.map((skill) => ({
    subject: skill,
    value: ratings[skill],
    fullMark: 10,
  }));

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
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">Assessments</h2>
            <p className="font-body text-sm text-zinc-500">Rate your skills and track progress</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Skill raters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-zinc-900">Skill Ratings</h3>
            <span className="font-body text-xs text-zinc-400">Rate 1–10</span>
          </div>

          {SKILLS.map((skill) => {
            const cfg = SKILL_CONFIGS[skill];
            const rating = ratings[skill];
            return (
              <div key={skill}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cfg.emoji}</span>
                    <span className="font-display text-sm font-semibold text-zinc-900">{skill}</span>
                    <span className="font-body text-xs text-zinc-400 hidden sm:inline">
                      — {cfg.desc}
                    </span>
                  </div>
                  <span className={cn('font-display text-sm font-semibold', cfg.textColor)}>
                    {rating}/10
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <motion.button
                      key={n}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleRate(skill, n)}
                      title={`Rate ${n}`}
                      className={cn(
                        'h-3 rounded-full flex-1 transition-all',
                        n <= rating ? cfg.dotColor : 'bg-zinc-200 hover:bg-zinc-300'
                      )}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className={cn(
              'w-full py-3 rounded-full font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-2',
              saved
                ? 'bg-green-500 text-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            )}
          >
            {saved ? <><Check size={15} /> Assessment Saved</> : 'Save Assessment'}
          </motion.button>
        </motion.div>

        {/* Radar chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl p-5 shadow-sm h-fit"
        >
          <h3 className="font-display text-base font-semibold text-zinc-900 mb-1">Skill Map</h3>
          <p className="font-body text-xs text-zinc-400 mb-2">Current ratings</p>
          {mounted ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f4f4f5" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: '#71717a' }}
                />
                <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] bg-zinc-50 rounded-xl animate-pulse" />
          )}
        </motion.div>
      </div>

      {/* Assessment history */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-zinc-100">
          <h3 className="font-display text-base font-semibold text-zinc-900">History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-zinc-50 bg-zinc-50/60">
                <th className="px-4 py-2.5 text-left font-body text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Date
                </th>
                {SKILLS.map((s) => (
                  <th
                    key={s}
                    className="px-3 py-2.5 text-center font-body text-xs font-semibold text-zinc-400 uppercase tracking-wider"
                  >
                    {s.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...mockHistory].reverse().map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors',
                    i === 0 && 'bg-amber-50/30'
                  )}
                >
                  <td className="px-4 py-3 font-body text-sm font-medium text-zinc-800">
                    {row.date}
                    {i === 0 && (
                      <span className="ml-2 font-body text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        latest
                      </span>
                    )}
                  </td>
                  {SKILLS.map((s) => (
                    <td key={s} className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          'font-display text-sm font-semibold',
                          SKILL_CONFIGS[s].textColor
                        )}
                      >
                        {row[s]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
