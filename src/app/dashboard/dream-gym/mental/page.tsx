'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Brain, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Load Lottie client-side only (uses browser APIs)
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────
type BreathPhase = 'inhale' | 'hold' | 'exhale';

const PHASES: Record<BreathPhase, { duration: number; label: string; color: string }> = {
  inhale: { duration: 4, label: 'Breathe In', color: 'text-blue-600' },
  hold: { duration: 4, label: 'Hold', color: 'text-purple-600' },
  exhale: { duration: 6, label: 'Breathe Out', color: 'text-amber-600' },
};

const PHASE_ORDER: BreathPhase[] = ['inhale', 'hold', 'exhale'];

const SCALE: Record<BreathPhase, { initial: number; target: number }> = {
  inhale: { initial: 0.7, target: 1.2 },
  hold: { initial: 1.2, target: 1.2 },
  exhale: { initial: 1.2, target: 0.7 },
};

// ─── Mood data ────────────────────────────────────────────────
const moods = [
  { score: 1, emoji: '😞', label: 'Very Low' },
  { score: 2, emoji: '😕', label: 'Low' },
  { score: 3, emoji: '😐', label: 'Neutral' },
  { score: 4, emoji: '😊', label: 'Good' },
  { score: 5, emoji: '😄', label: 'Great' },
];

// ─── Visualization prompts ────────────────────────────────────
const prompts = [
  {
    id: 'prematch',
    title: 'Pre-Match Focus',
    icon: '⚽',
    text: 'Breathe deeply. Picture yourself walking onto the pitch, fully warmed up. Your legs feel strong, your touch is sharp. The crowd fades away — it\'s just you and the game. See yourself making your first key pass or tackle with total precision and confidence.',
  },
  {
    id: 'goal',
    title: 'Scoring the Goal',
    icon: '🥅',
    text: 'Visualize the moment. A perfect through ball, you\'re running onto it. The goalkeeper comes off his line. Stay calm — plant your standing foot, eyes on the ball, pick the corner low. Watch it nestle into the net. Feel the celebration.',
  },
  {
    id: 'bounce',
    title: 'Bouncing Back',
    icon: '💪',
    text: 'You\'ve made a mistake. That\'s okay — the best players in the world make mistakes every match. Take three seconds, take a breath, and let it go. Your next touch will be your best. Refocus, reset, and get back into the game stronger.',
  },
];

// ─── Breathing Section ────────────────────────────────────────
function BreathingSection() {
  const [active, setActive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [animData, setAnimData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lottieRef = useRef<any>(null);

  // Load Lottie JSON (filename has a space, use fetch)
  useEffect(() => {
    fetch('/animations/recovery/meditate v2.json')
      .then((r) => r.json())
      .then(setAnimData)
      .catch(() => null);
  }, []);

  const toggle = () => {
    if (!lottieRef.current) return;
    if (active) {
      lottieRef.current.pause();
    } else {
      lottieRef.current.play();
    }
    setActive((a) => !a);
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 text-white overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -translate-y-24 translate-x-24" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full translate-y-16 -translate-x-16" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="font-display text-base font-semibold">Mindful Breathing</h3>
          <span className="font-body text-xs text-zinc-400 ml-auto">4-4-6 technique</span>
        </div>

        <div className="flex flex-col items-center">
          {/* Lottie animation — play/pause controlled via ref */}
          <div className="w-64 h-64">
            {animData ? (
              <Lottie
                lottieRef={lottieRef}
                animationData={animData}
                loop
                autoplay={false}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-white/5 animate-pulse" />
            )}
          </div>

          {/* Start / Stop button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={toggle}
            className={cn(
              'mt-4 px-8 py-3 rounded-full font-display font-semibold text-sm transition-colors',
              active
                ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            )}
          >
            {active ? 'Stop' : 'Start Breathing'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Mood Section ─────────────────────────────────────────────
function MoodSection() {
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSelect = (score: number) => {
    setSelected(score);
    setSaved(false);
  };

  const handleSave = () => {
    if (selected === null) return;
    console.log('Log mood:', { score: selected });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold text-zinc-900">Mood Check-in</h3>
        <span className="font-body text-xs text-zinc-400">How are you feeling today?</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        {moods.map((m) => (
          <motion.button
            key={m.score}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => handleSelect(m.score)}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={cn(
                'text-3xl transition-all duration-200',
                selected === m.score ? 'scale-125' : 'opacity-50'
              )}
            >
              {m.emoji}
            </span>
            <span
              className={cn(
                'font-body text-xs transition-colors',
                selected === m.score ? 'text-zinc-700 font-medium' : 'text-zinc-400'
              )}
            >
              {m.label}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className={cn(
              'w-full py-2.5 rounded-full font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2',
              saved ? 'bg-green-500 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
            )}
          >
            {saved ? <><Check size={14} /> Logged</> : 'Log Mood'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Journal Section ──────────────────────────────────────────
function JournalSection() {
  const [entry, setEntry] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!entry.trim()) return;
    console.log('Log journal:', { entry });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-base font-semibold text-zinc-900">Daily Journal</h3>
        <span className="font-body text-xs text-zinc-400">{entry.length}/300</span>
      </div>
      <textarea
        value={entry}
        onChange={(e) => {
          if (e.target.value.length <= 300) {
            setEntry(e.target.value);
            setSaved(false);
          }
        }}
        rows={4}
        placeholder="Write about today's training, how you felt, what you want to improve, or anything on your mind..."
        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-zinc-400 resize-none transition-colors mb-3"
      />
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={!entry.trim()}
        className={cn(
          'w-full py-2.5 rounded-full font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2',
          saved
            ? 'bg-green-500 text-white'
            : entry.trim()
            ? 'bg-zinc-900 text-white hover:bg-zinc-800'
            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
        )}
      >
        {saved ? <><Check size={14} /> Saved</> : 'Save Entry'}
      </motion.button>
    </div>
  );
}

// ─── Visualization Section ────────────────────────────────────
function VisualizationSection() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-display text-base font-semibold text-zinc-900 mb-1">
        Visualization Prompts
      </h3>
      <p className="font-body text-sm text-zinc-500 mb-4">
        Find a quiet spot. Close your eyes and follow the prompt.
      </p>
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="rounded-xl border border-zinc-200 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === prompt.id ? null : prompt.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left"
            >
              <span className="text-xl shrink-0">{prompt.icon}</span>
              <span className="font-display text-sm font-semibold text-zinc-900 flex-1">
                {prompt.title}
              </span>
              <motion.div
                animate={{ rotate: expanded === prompt.id ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={16} className="text-zinc-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {expanded === prompt.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-100">
                    <p className="font-body text-sm text-zinc-600 leading-relaxed">
                      {prompt.text}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function MentalPage() {
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
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">Mental</h2>
            <p className="font-body text-sm text-zinc-500">Focus, breathing, and visualization</p>
          </div>
        </div>
      </motion.div>

      {/* Sections */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <BreathingSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MoodSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <JournalSection />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="pb-8"
      >
        <VisualizationSection />
      </motion.div>
    </div>
  );
}
