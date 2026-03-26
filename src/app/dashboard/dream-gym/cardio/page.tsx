'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, Pause, RotateCcw, Timer, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Data ─────────────────────────────────────────────────────
const cardioTypes = [
  {
    id: 'run',
    label: 'Steady Run',
    description: 'Maintain a consistent pace for 20–40 min',
    targetMin: 25,
    color: 'bg-blue-500',
    tip: 'Keep your breathing controlled. You should be able to hold a conversation.',
  },
  {
    id: 'sprint',
    label: 'Sprint Sets',
    description: '8 × 60m sprints with 2 min recovery',
    targetMin: 20,
    color: 'bg-red-500',
    tip: 'Drive your knees high. Explode off the start, maintain form on each rep.',
  },
  {
    id: 'interval',
    label: 'Intervals',
    description: '5 rounds: 2 min hard / 1 min easy',
    targetMin: 15,
    color: 'bg-orange-500',
    tip: 'The hard intervals should feel very difficult. Recover fully before each round.',
  },
  {
    id: 'recovery',
    label: 'Recovery Run',
    description: 'Easy jog to flush the legs, 20 min',
    targetMin: 20,
    color: 'bg-green-500',
    tip: 'Keep effort very low — this is active recovery. If it feels hard, slow down.',
  },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Page ─────────────────────────────────────────────────────
export default function CardioPage() {
  const [activeType, setActiveType] = useState(cardioTypes[0]);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const reset = () => {
    setRunning(false);
    setElapsed(0);
  };

  const handleTypeChange = (type: (typeof cardioTypes)[0]) => {
    reset();
    setActiveType(type);
    setSaved(false);
    setDistance('');
    setNotes('');
  };

  const handleSave = () => {
    if (elapsed === 0) return;
    setRunning(false);
    console.log('Log cardio:', { type: activeType.id, elapsed, distance, notes });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const targetSeconds = activeType.targetMin * 60;
  const progress = Math.min(elapsed / targetSeconds, 1);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
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
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
            <Timer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">Cardio</h2>
            <p className="font-body text-sm text-zinc-500">Track your endurance training</p>
          </div>
        </div>
      </motion.div>

      {/* Type selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        {cardioTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleTypeChange(type)}
            className={cn(
              'p-4 rounded-2xl text-left transition-all border-2',
              activeType.id === type.id
                ? 'border-zinc-900 bg-white shadow-md'
                : 'border-transparent bg-white shadow-sm hover:shadow-md'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
                type.color
              )}
            >
              <Timer className="w-4 h-4 text-white" />
            </div>
            <p className="font-display text-sm font-semibold text-zinc-900">{type.label}</p>
            <p className="font-body text-xs text-zinc-500 mt-0.5">{type.description}</p>
          </button>
        ))}
      </motion.div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        {/* Circular progress ring */}
        <div className="relative w-48 h-48 mx-auto mb-5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="8" />
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={progress >= 1 ? '#22c55e' : '#f59e0b'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: (1 - progress) * circumference }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p
              key={Math.floor(elapsed / 10)}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-display text-4xl font-semibold text-zinc-900"
            >
              {formatTime(elapsed)}
            </motion.p>
            <p className="font-body text-xs text-zinc-400 mt-1">
              Target: {activeType.targetMin} min
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-5">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={reset}
            disabled={elapsed === 0 && !running}
            className="w-12 h-12 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors"
          >
            <RotateCcw size={18} className="text-zinc-600" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setRunning((r) => !r)}
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
              running ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-amber-500 hover:bg-amber-600'
            )}
          >
            {running ? (
              <Pause size={22} className="text-white" />
            ) : (
              <Play size={22} className="text-white ml-0.5" />
            )}
          </motion.button>

          <div className="w-12 h-12" />
        </div>

        {/* Coach tip */}
        <div className="bg-zinc-50 rounded-xl px-4 py-3">
          <p className="font-body text-xs text-zinc-500 text-center">{activeType.tip}</p>
        </div>
      </motion.div>

      {/* Log form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
      >
        <p className="font-display text-sm font-semibold text-zinc-700">Log Session</p>

        <div>
          <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
            Distance (km)
          </label>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="e.g. 5.0"
            step="0.1"
            min="0"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-zinc-400 transition-colors"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-zinc-700 mb-1.5">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="How did the session feel? Any pain or issues?"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-zinc-400 resize-none transition-colors"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={elapsed === 0}
          className={cn(
            'w-full py-3 rounded-full font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2',
            saved
              ? 'bg-green-500 text-white'
              : elapsed > 0
              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
          )}
        >
          {saved ? (
            <>
              <Check size={16} /> Saved!
            </>
          ) : (
            'Save Session'
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
