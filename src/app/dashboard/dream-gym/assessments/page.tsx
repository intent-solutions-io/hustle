'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ClipboardCheck, Check, Loader2 } from 'lucide-react';
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
import { getInitials, getAvatarColor } from '@/lib/player-utils';
import { format } from 'date-fns';

// ─── Data ─────────────────────────────────────────────────────
type Skill = 'Speed' | 'Agility' | 'Strength' | 'Endurance' | 'Technical' | 'Mental';

const SKILL_CONFIGS: Record<
  Skill,
  { emoji: string; desc: string; dotColor: string; textColor: string; testType: string; unit: string }
> = {
  Speed:     { emoji: '⚡', desc: 'Sprint pace and acceleration',       dotColor: 'bg-red-500',    textColor: 'text-red-600',    testType: '40_yard_dash', unit: 'seconds' },
  Agility:   { emoji: '🤸', desc: 'Change of direction and quickness',  dotColor: 'bg-orange-500', textColor: 'text-orange-600', testType: 'pro_agility',  unit: 'seconds' },
  Strength:  { emoji: '💪', desc: 'Physical power and muscular fitness', dotColor: 'bg-amber-500',  textColor: 'text-amber-600',  testType: 'pushups_1min', unit: 'count' },
  Endurance: { emoji: '🫁', desc: 'Stamina across 90 minutes',          dotColor: 'bg-cyan-500',   textColor: 'text-cyan-600',   testType: 'beep_test',    unit: 'level' },
  Technical: { emoji: '⚽', desc: 'Ball control, passing, finishing',   dotColor: 'bg-blue-500',   textColor: 'text-blue-600',   testType: 'plank_hold',   unit: 'seconds' },
  Mental:    { emoji: '🧠', desc: 'Focus, composure, and resilience',   dotColor: 'bg-purple-500', textColor: 'text-purple-600', testType: 'situps_1min',  unit: 'count' },
};

const SKILLS = Object.keys(SKILL_CONFIGS) as Skill[];

// Map skill rating (1-10) → API value
function ratingToValue(skill: Skill, rating: number): number {
  switch (skill) {
    case 'Speed':     return parseFloat((10.0 - (rating - 1) * (6.0 / 9)).toFixed(2)); // 10s→4s
    case 'Agility':   return parseFloat((8.0  - (rating - 1) * (4.5 / 9)).toFixed(2)); // 8s→3.5s
    case 'Technical': return Math.round(rating * 30); // 30-300 seconds
    default:          return rating; // beep_test, pushups_1min, situps_1min — 1-10 is valid
  }
}

// Map API value → skill rating (1-10)
function valueToRating(skill: Skill, value: number): number {
  switch (skill) {
    case 'Speed':     return Math.min(10, Math.max(1, Math.round(1 + (10.0 - value) * (9 / 6.0))));
    case 'Agility':   return Math.min(10, Math.max(1, Math.round(1 + (8.0 - value)  * (9 / 4.5))));
    case 'Technical': return Math.min(10, Math.max(1, Math.round(value / 30)));
    default:          return Math.min(10, Math.max(1, Math.round(value)));
  }
}

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '12px',
};

interface PlayerOption {
  id: string;
  name: string;
}

interface AssessmentEntry {
  id: string;
  date: string;
  testType: string;
  value: number;
}

const DEFAULT_RATINGS: Record<Skill, number> = {
  Speed: 5, Agility: 5, Strength: 5, Endurance: 5, Technical: 5, Mental: 5,
};

// ─── Page ─────────────────────────────────────────────────────
export default function AssessmentsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<AssessmentEntry[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [ratings, setRatings] = useState<Record<Skill, number>>(DEFAULT_RATINGS);
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

  // Load assessments when player changes
  useEffect(() => {
    if (!selectedPlayerId) return;
    setLoadingAssessments(true);
    fetch(`/api/players/${selectedPlayerId}/assessments?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        const entries: AssessmentEntry[] = data.assessments ?? [];
        setAssessments(entries);
        // Pre-populate sliders from latest value per test type
        const newRatings = { ...DEFAULT_RATINGS };
        for (const skill of SKILLS) {
          const cfg = SKILL_CONFIGS[skill];
          const latest = entries.find((a) => a.testType === cfg.testType);
          if (latest) newRatings[skill] = valueToRating(skill, latest.value);
        }
        setRatings(newRatings);
      })
      .catch(() => null)
      .finally(() => setLoadingAssessments(false));
  }, [selectedPlayerId]);

  const handleRate = (skill: Skill, value: number) => {
    setRatings((prev) => ({ ...prev, [skill]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedPlayerId) return;
    setSaving(true);
    try {
      const date = new Date().toISOString();
      await Promise.all(
        SKILLS.map((skill) => {
          const cfg = SKILL_CONFIGS[skill];
          return fetch(`/api/players/${selectedPlayerId}/assessments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date,
              testType: cfg.testType,
              value: ratingToValue(skill, ratings[skill]),
              unit: cfg.unit,
            }),
          });
        })
      );
      // Reload
      const res = await fetch(`/api/players/${selectedPlayerId}/assessments?limit=50`);
      const data = res.ok ? await res.json() : { assessments: [] };
      setAssessments(data.assessments ?? []);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
    }
  };

  const radarData = SKILLS.map((skill) => ({
    subject: skill,
    value: ratings[skill],
    fullMark: 10,
  }));

  // Group assessments into "sessions" by day
  const sessions: { date: string; skills: Partial<Record<Skill, number>> }[] = [];
  const byDay = new Map<string, AssessmentEntry[]>();
  for (const entry of assessments) {
    const day = entry.date.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(entry);
  }
  for (const [day, entries] of byDay) {
    const skills: Partial<Record<Skill, number>> = {};
    for (const skill of SKILLS) {
      const cfg = SKILL_CONFIGS[skill];
      const match = entries.find((e) => e.testType === cfg.testType);
      if (match) skills[skill] = valueToRating(skill, match.value);
    }
    sessions.push({ date: day, skills });
  }
  sessions.sort((a, b) => b.date.localeCompare(a.date));

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

      {/* Player selector */}
      {players.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="font-body text-xs text-zinc-500">Assessing:</span>
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

      {loadingAssessments && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      )}

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
            disabled={saving || !selectedPlayerId}
            className={cn(
              'w-full py-3 rounded-full font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-2',
              saved
                ? 'bg-green-500 text-white'
                : !selectedPlayerId
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            )}
          >
            {saved ? (
              <><Check size={15} /> Assessment Saved</>
            ) : saving ? (
              <><Loader2 size={15} className="animate-spin" /> Saving…</>
            ) : (
              'Save Assessment'
            )}
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
            <div className="h-65 bg-zinc-50 rounded-xl animate-pulse" />
          )}
        </motion.div>
      </div>

      {/* Assessment history */}
      {sessions.length > 0 && (
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
            <table className="w-full min-w-125">
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
                {sessions.map((session, i) => (
                  <tr
                    key={session.date}
                    className={cn(
                      'border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors',
                      i === 0 && 'bg-amber-50/30'
                    )}
                  >
                    <td className="px-4 py-3 font-body text-sm font-medium text-zinc-800">
                      {format(new Date(session.date), 'MMM d, yyyy')}
                      {i === 0 && (
                        <span className="ml-2 font-body text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          latest
                        </span>
                      )}
                    </td>
                    {SKILLS.map((s) => (
                      <td key={s} className="px-3 py-3 text-center">
                        {session.skills[s] != null ? (
                          <span className={cn('font-display text-sm font-semibold', SKILL_CONFIGS[s].textColor)}>
                            {session.skills[s]}
                          </span>
                        ) : (
                          <span className="font-body text-xs text-zinc-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
