'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  CheckCircle,
  Circle,
  Trophy,
  Clock,
  Dumbbell,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { workoutTemplates, type WorkoutTemplate } from '@/lib/dream-gym/workout-templates';
import { getWorkoutAnimation } from '@/lib/dream-gym/exercise-animations';
import { cn } from '@/lib/utils';

interface PlayerOption {
  id: string;
  name: string;
}

const categoryColors: Record<string, string> = {
  strength: 'text-orange-600 bg-orange-50',
  conditioning: 'text-red-600 bg-red-50',
  core: 'text-amber-600 bg-amber-50',
  recovery: 'text-green-600 bg-green-50',
};

// ─── Template Picker ──────────────────────────────────────────
function TemplatePicker({ onSelect }: { onSelect: (t: WorkoutTemplate) => void }) {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/dashboard/dream-gym"
          className="inline-flex items-center gap-1.5 font-body text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
        >
          <ChevronLeft size={15} />
          Dream Gym
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">Workout</h2>
            <p className="font-body text-sm text-zinc-500">Choose a template to begin</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      >
        {workoutTemplates.map((t) => (
          <motion.button
            key={t.id}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(t)}
            className="bg-white rounded-2xl p-5 shadow-sm text-left group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{t.icon}</span>
              <span className="font-body text-xs text-zinc-400 flex items-center gap-1">
                <Clock size={11} />
                {t.duration}
              </span>
            </div>
            <h3 className="font-display text-base font-semibold text-zinc-900 mb-1">{t.name}</h3>
            <p className="font-body text-sm text-zinc-500 mb-3">{t.description}</p>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-zinc-400">
                {t.exercises.length} exercises
              </span>
              <span className="inline-flex items-center gap-1 text-amber-600 font-body text-xs font-medium group-hover:gap-2 transition-all">
                Start <ArrowRight size={12} />
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Completion Screen ────────────────────────────────────────
function CompletionScreen({
  template,
  durationMinutes,
  onReset,
}: {
  template: WorkoutTemplate;
  durationMinutes: number;
  onReset: () => void;
}) {
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((d) => {
        const list: PlayerOption[] = d.players ?? [];
        setPlayers(list);
        if (list.length === 1) setSelectedPlayerId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!selectedPlayerId) return;
    setSaving(true);
    try {
      const exercises = template.exercises.map((ex) => ({
        exerciseId: ex.name.toLowerCase().replace(/\s+/g, '_'),
        exerciseName: ex.name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          setNumber: i + 1,
          reps: typeof ex.reps === 'string' && ex.reps.includes('s') ? 0 : parseInt(ex.reps) || 0,
          weight: null,
          completed: true,
        })),
      }));

      await fetch('/api/workout-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayerId,
          date: new Date().toISOString(),
          type: template.id === 'strength' ? 'strength'
            : template.id === 'conditioning' ? 'conditioning'
            : template.id === 'core' ? 'core'
            : template.id === 'recovery' ? 'recovery'
            : 'custom',
          title: template.name,
          duration: durationMinutes,
          exercises,
        }),
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save workout log:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white rounded-2xl p-8 shadow-sm text-center w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Trophy className="w-10 h-10 text-green-600" />
        </motion.div>
        <h2 className="font-display text-2xl font-semibold text-zinc-900 mb-1">
          Workout Complete!
        </h2>
        <p className="font-body text-sm text-zinc-500">{template.name}</p>
        <p className="font-body text-sm text-zinc-400 mb-6">
          {template.exercises.length} exercises · {template.duration}
        </p>

        {/* Save to log */}
        {!saved && players.length > 0 && (
          <div className="mb-5 text-left">
            <p className="font-body text-sm font-medium text-zinc-700 mb-2">Log for athlete:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full font-body text-sm transition-colors',
                    selectedPlayerId === p.id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={!selectedPlayerId || saving}
              className="w-full py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-display font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </span>
              ) : (
                'Save to Training Log'
              )}
            </button>
          </div>
        )}

        {saved && (
          <div className="mb-5 bg-green-50 rounded-xl py-2.5 text-center">
            <p className="font-body text-sm text-green-700 font-medium">✓ Saved to training log</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 py-3 rounded-full border-2 border-zinc-200 font-display font-semibold text-sm text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
          >
            Another Workout
          </button>
          <Link href="/dashboard/dream-gym" className="flex-1">
            <span className="block text-center py-3 rounded-full bg-zinc-900 text-white font-display font-semibold text-sm hover:bg-zinc-800 transition-colors">
              Done
            </span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function WorkoutPage() {
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [startedAt, setStartedAt] = useState<Date | null>(null);

  const selectTemplate = (t: WorkoutTemplate) => {
    setTemplate(t);
    setActiveIdx(0);
    setCompleted(new Set());
    setStartedAt(new Date());
  };

  const resetAll = () => {
    setTemplate(null);
    setActiveIdx(0);
    setCompleted(new Set());
    setStartedAt(null);
  };

  const completeExercise = () => {
    if (!template) return;
    const next = new Set(completed);
    next.add(activeIdx);
    setCompleted(next);
    // Advance to next incomplete exercise
    const nextIdx = template.exercises.findIndex((_, i) => !next.has(i));
    if (nextIdx !== -1) setActiveIdx(nextIdx);
  };

  if (!template) return <TemplatePicker onSelect={selectTemplate} />;

  const isFinished = completed.size === template.exercises.length;
  const durationMinutes = startedAt
    ? Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000))
    : parseInt(template.duration) || 30;

  if (isFinished) return <CompletionScreen template={template} durationMinutes={durationMinutes} onReset={resetAll} />;

  const exercise = template.exercises[activeIdx];
  const videoSrc = getWorkoutAnimation(exercise.name);
  const progress = completed.size / template.exercises.length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => setTemplate(null)}
          className="inline-flex items-center gap-1.5 font-body text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-3"
        >
          <ChevronLeft size={15} />
          Choose Template
        </button>

        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-zinc-900">{template.name}</h2>
            <p className="font-body text-sm text-zinc-500">
              Exercise {Math.min(completed.size + 1, template.exercises.length)} of{' '}
              {template.exercises.length}
            </p>
          </div>
          <span className="font-display text-sm font-semibold text-zinc-600 bg-white px-3 py-1.5 rounded-full shadow-sm">
            {template.duration}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Active exercise */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Video */}
            <div className="aspect-[4/5] bg-zinc-900 flex items-center justify-center p-4">
              <video
                key={videoSrc}
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Exercise info */}
            <div className="p-5">
              <span
                className={cn(
                  'font-body text-xs font-medium px-2.5 py-0.5 rounded-full',
                  categoryColors[exercise.category]
                )}
              >
                {exercise.category}
              </span>
              <h3 className="font-display text-xl font-semibold text-zinc-900 mt-2 mb-4">
                {exercise.name}
              </h3>

              <div className="flex items-center gap-6 mb-5">
                <div className="text-center">
                  <p className="font-display text-3xl font-semibold text-zinc-900">
                    {exercise.sets}
                  </p>
                  <p className="font-body text-xs text-zinc-400">Sets</p>
                </div>
                <div className="w-px h-10 bg-zinc-200" />
                <div className="text-center">
                  <p className="font-display text-3xl font-semibold text-zinc-900">
                    {exercise.reps}
                  </p>
                  <p className="font-body text-xs text-zinc-400">Reps</p>
                </div>
                <div className="w-px h-10 bg-zinc-200" />
                <div className="text-center">
                  <p className="font-display text-3xl font-semibold text-zinc-900">
                    {exercise.rest}
                  </p>
                  <p className="font-body text-xs text-zinc-400">Rest</p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={completeExercise}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-display font-semibold text-base transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Complete Exercise
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Exercise list */}
        <div className="bg-white rounded-2xl p-4 shadow-sm h-fit">
          <p className="font-display text-sm font-semibold text-zinc-700 mb-3">Exercises</p>
          <div className="space-y-1.5">
            {template.exercises.map((ex, i) => {
              const isDone = completed.has(i);
              const isActive = i === activeIdx && !isDone;
              return (
                <motion.button
                  key={ex.name}
                  onClick={() => setActiveIdx(i)}
                  whileHover={{ x: 2 }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                    isActive && 'bg-amber-50 ring-1 ring-amber-200',
                    isDone && 'opacity-50',
                    !isActive && !isDone && 'hover:bg-zinc-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                      isDone
                        ? 'bg-green-100'
                        : isActive
                        ? 'bg-amber-500'
                        : 'bg-zinc-100'
                    )}
                  >
                    {isDone ? (
                      <CheckCircle size={13} className="text-green-600" />
                    ) : isActive ? (
                      <span className="w-2 h-2 bg-white rounded-full" />
                    ) : (
                      <Circle size={10} className="text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-zinc-800 truncate">
                      {ex.name}
                    </p>
                    <p className="font-body text-xs text-zinc-400">
                      {ex.sets} × {ex.reps}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
