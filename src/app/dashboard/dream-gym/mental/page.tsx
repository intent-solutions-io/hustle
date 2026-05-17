'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Brain, Check, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getInitials, getAvatarColor } from '@/lib/player-utils';

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

interface PlayerOption {
  id: string;
  name: string;
}

interface CheckIn {
  date: string | Date;
  mood: number;
}

interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

// ─── Breathing Section ────────────────────────────────────────
function BreathingSection() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [countdown, setCountdown] = useState(PHASES.inhale.duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseIndexRef = useRef(0);
  const countdownRef = useRef(PHASES.inhale.duration);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const toggle = () => {
    if (active) {
      // Stop
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      phaseIndexRef.current = 0;
      countdownRef.current = PHASES.inhale.duration;
      setPhase('inhale');
      setCountdown(PHASES.inhale.duration);
      setActive(false);
    } else {
      // Start
      phaseIndexRef.current = 0;
      countdownRef.current = PHASES.inhale.duration;
      setPhase('inhale');
      setCountdown(PHASES.inhale.duration);
      setActive(true);

      intervalRef.current = setInterval(() => {
        countdownRef.current -= 1;
        if (countdownRef.current <= 0) {
          // Advance to next phase
          phaseIndexRef.current = (phaseIndexRef.current + 1) % PHASE_ORDER.length;
          const nextPhase = PHASE_ORDER[phaseIndexRef.current];
          countdownRef.current = PHASES[nextPhase].duration;
          setPhase(nextPhase);
        }
        setCountdown(countdownRef.current);
      }, 1000);
    }
  };

  const phaseConfig = PHASES[phase];
  const scaleConfig = SCALE[phase];

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 text-white overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -translate-y-24 translate-x-24" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full translate-y-16 -translate-x-16" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="font-display text-base font-semibold">Mindful Breathing</h3>
          <span className="font-body text-xs text-zinc-400 ml-auto">4-4-6 technique</span>
        </div>

        <div className="flex flex-col items-center">
          {/* Animated breathing circle */}
          <div className="relative flex items-center justify-center my-4" style={{ width: 200, height: 200 }}>
            {/* Outer glow */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 200,
                height: 200,
                background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
              }}
              animate={{ scale: active ? scaleConfig.target * 1.3 : 1 }}
              transition={{
                duration: active ? phaseConfig.duration : 0.5,
                ease: phase === 'hold' ? 'linear' : 'easeInOut',
              }}
            />
            {/* Main circle */}
            <motion.div
              className="rounded-full"
              style={{
                width: 140,
                height: 140,
                background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                opacity: 0.85,
              }}
              animate={{ scale: active ? scaleConfig.target : scaleConfig.initial }}
              transition={{
                duration: active ? phaseConfig.duration : 0.5,
                ease: phase === 'hold' ? 'linear' : 'easeInOut',
              }}
            />
            {/* Center content */}
            <div className="absolute flex flex-col items-center">
              {active ? (
                <span className="font-display text-4xl font-bold text-white leading-none">
                  {countdown}
                </span>
              ) : (
                <Brain className="w-8 h-8 text-white/50" />
              )}
            </div>
          </div>

          {/* Phase label */}
          <div className="h-8 flex items-center justify-center mb-2">
            <AnimatePresence mode="wait">
              {active && (
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className={cn('font-display text-base font-semibold', phaseConfig.color)}
                >
                  {phaseConfig.label}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Start / Stop button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={toggle}
            className={cn(
              'px-8 py-3 rounded-full font-display font-semibold text-sm transition-colors',
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
function MoodSection({
  playerId,
  history,
  onSaved,
}: {
  playerId: string | null;
  history: CheckIn[];
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = (score: number) => {
    setSelected(score);
    setSaved(false);
  };

  const handleSave = async () => {
    if (selected === null || !playerId) return;
    setSaving(true);
    try {
      await fetch(`/api/players/${playerId}/dream-gym/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: selected,
          energy: 'ok',
          soreness: 'low',
          stress: 'low',
        }),
      });
      setSaved(true);
      setSelected(null);
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
    }
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
            disabled={saving || !playerId}
            className={cn(
              'w-full py-2.5 rounded-full font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2',
              saved ? 'bg-green-500 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800',
              (saving || !playerId) && 'opacity-60 cursor-not-allowed'
            )}
          >
            {saved ? <><Check size={14} /> Logged</> : saving ? 'Saving…' : 'Log Mood'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mood history */}
      {history.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-4 space-y-2">
          <p className="font-body text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Recent Check-ins</p>
          {history.map((c, i) => {
            const mood = moods.find((m) => m.score === c.mood);
            return (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{mood?.emoji ?? '😐'}</span>
                  <span className="font-body text-sm text-zinc-700">{mood?.label ?? 'Neutral'}</span>
                </div>
                <span className="font-body text-xs text-zinc-400">
                  {format(new Date(c.date), 'MMM d, h:mm a')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Journal Section ──────────────────────────────────────────
function JournalSection({
  playerId,
  history,
  onSaved,
}: {
  playerId: string | null;
  history: JournalEntry[];
  onSaved: () => void;
}) {
  const [entry, setEntry] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!entry.trim() || !playerId) return;
    setSaving(true);
    try {
      await fetch(`/api/players/${playerId}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          content: entry.trim(),
          context: 'daily_journal',
        }),
      });
      setSaved(true);
      setEntry('');
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // non-blocking
    } finally {
      setSaving(false);
    }
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
        disabled={!entry.trim() || saving || !playerId}
        className={cn(
          'w-full py-2.5 rounded-full font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2',
          saved
            ? 'bg-green-500 text-white'
            : entry.trim() && playerId
            ? 'bg-zinc-900 text-white hover:bg-zinc-800'
            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
        )}
      >
        {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving…' : 'Save Entry'}
      </motion.button>

      {/* Journal history */}
      {history.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-4 space-y-3">
          <p className="font-body text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Past Entries</p>
          {history.map((e) => (
            <div key={e.id} className="rounded-xl bg-zinc-50 px-4 py-3">
              <p className="font-body text-xs text-zinc-400 mb-1">
                {format(new Date(e.date), 'MMM d, yyyy · h:mm a')}
              </p>
              <p className="font-body text-sm text-zinc-700 leading-snug">
                {e.content.length > 80 ? e.content.slice(0, 80) + '…' : e.content}
              </p>
            </div>
          ))}
        </div>
      )}
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
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [moodHistory, setMoodHistory] = useState<CheckIn[]>([]);
  const [journalHistory, setJournalHistory] = useState<JournalEntry[]>([]);

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

  const loadHistory = async (playerId: string) => {
    const [dgRes, jRes] = await Promise.all([
      fetch(`/api/players/${playerId}/dream-gym`),
      fetch(`/api/players/${playerId}/journal?limit=5`),
    ]);
    if (dgRes.ok) {
      const dgData = await dgRes.json();
      const checkIns: CheckIn[] = dgData.dreamGym?.mental?.checkIns ?? [];
      // Most recent first, cap at 5
      const sorted = [...checkIns].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setMoodHistory(sorted.slice(0, 5));
    }
    if (jRes.ok) {
      const jData = await jRes.json();
      setJournalHistory(jData.entries ?? []);
    }
  };

  useEffect(() => {
    if (selectedPlayerId) loadHistory(selectedPlayerId);
    else { setMoodHistory([]); setJournalHistory([]); }
   
  }, [selectedPlayerId]);

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

      {/* Player selector */}
      {players.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="font-body text-xs text-zinc-500">Logging for:</span>
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
        <MoodSection
          playerId={selectedPlayerId}
          history={moodHistory}
          onSaved={() => { if (selectedPlayerId) loadHistory(selectedPlayerId); }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <JournalSection
          playerId={selectedPlayerId}
          history={journalHistory}
          onSaved={() => { if (selectedPlayerId) loadHistory(selectedPlayerId); }}
        />
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
