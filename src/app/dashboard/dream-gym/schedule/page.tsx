'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────
type Slot = 'morning' | 'afternoon' | 'evening';
type SessionType = 'workout' | 'cardio' | 'practice' | 'mental' | 'rest';
type DaySchedule = Record<Slot, SessionType | null>;
type WeekSchedule = Record<string, DaySchedule>; // key = 'yyyy-MM-dd'

const SESSION_CONFIGS: Record<
  SessionType,
  { label: string; emoji: string; color: string; bg: string }
> = {
  workout: { label: 'Workout', emoji: '💪', color: 'text-orange-700', bg: 'bg-orange-100' },
  cardio: { label: 'Cardio', emoji: '🏃', color: 'text-red-700', bg: 'bg-red-100' },
  practice: { label: 'Practice', emoji: '⚽', color: 'text-amber-700', bg: 'bg-amber-100' },
  mental: { label: 'Mental', emoji: '🧘', color: 'text-purple-700', bg: 'bg-purple-100' },
  rest: { label: 'Rest', emoji: '😴', color: 'text-green-700', bg: 'bg-green-100' },
};

const SLOTS: { id: Slot; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
];

// ─── Helpers ─────────────────────────────────────────────────
function getWeekStart(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function buildMockSchedule(weekStart: Date): WeekSchedule {
  const s: WeekSchedule = {};
  const presets: Array<{ offset: number; slot: Slot; type: SessionType }> = [
    { offset: 0, slot: 'evening', type: 'workout' },
    { offset: 1, slot: 'morning', type: 'cardio' },
    { offset: 2, slot: 'afternoon', type: 'practice' },
    { offset: 3, slot: 'morning', type: 'workout' },
    { offset: 4, slot: 'evening', type: 'mental' },
    { offset: 5, slot: 'morning', type: 'practice' },
    { offset: 5, slot: 'afternoon', type: 'rest' },
  ];
  presets.forEach(({ offset, slot, type }) => {
    const key = format(addDays(weekStart, offset), 'yyyy-MM-dd');
    if (!s[key]) s[key] = { morning: null, afternoon: null, evening: null };
    s[key][slot] = type;
  });
  return s;
}

const INIT_WEEK = getWeekStart(new Date());

// ─── Page ─────────────────────────────────────────────────────
export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(INIT_WEEK);
  const [schedule, setSchedule] = useState<WeekSchedule>(() => buildMockSchedule(INIT_WEEK));
  const [activeCell, setActiveCell] = useState<{ dateKey: string; slot: Slot } | null>(null);

  const weekDays = getWeekDays(weekStart);
  const weekLabel = `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`;

  const getSession = (dateKey: string, slot: Slot): SessionType | null =>
    schedule[dateKey]?.[slot] ?? null;

  const emptyDay: DaySchedule = { morning: null, afternoon: null, evening: null };

  const assignSession = (dateKey: string, slot: Slot, type: SessionType) => {
    setSchedule((prev) => ({
      ...prev,
      [dateKey]: { ...emptyDay, ...prev[dateKey], [slot]: type },
    }));
    setActiveCell(null);
  };

  const clearSession = (dateKey: string, slot: Slot) => {
    setSchedule((prev) => ({
      ...prev,
      [dateKey]: { ...emptyDay, ...prev[dateKey], [slot]: null },
    }));
    setActiveCell(null);
  };

  const handleCellClick = (dateKey: string, slot: Slot) => {
    if (activeCell?.dateKey === dateKey && activeCell?.slot === slot) {
      setActiveCell(null);
    } else {
      setActiveCell({ dateKey, slot });
    }
  };

  const activeCellSession = activeCell
    ? getSession(activeCell.dateKey, activeCell.slot)
    : null;

  const activeDayDate = activeCell
    ? weekDays.find((d) => format(d, 'yyyy-MM-dd') === activeCell.dateKey)
    : null;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
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
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">Schedule</h2>
            <p className="font-body text-sm text-zinc-500">Plan your training week</p>
          </div>
        </div>
      </motion.div>

      {/* Week navigator */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm"
      >
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setWeekStart((ws) => addWeeks(ws, -1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <ChevronLeft size={16} className="text-zinc-600" />
        </motion.button>
        <p className="font-display text-sm font-semibold text-zinc-900">{weekLabel}</p>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setWeekStart((ws) => addWeeks(ws, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <ChevronRight size={16} className="text-zinc-600" />
        </motion.button>
      </motion.div>

      {/* Calendar grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {/* Day column headers */}
            <div className="grid grid-cols-[88px_repeat(7,1fr)] border-b border-zinc-100">
              <div />
              {weekDays.map((day) => {
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn('px-2 py-3 text-center', today && 'bg-amber-50')}
                  >
                    <p
                      className={cn(
                        'font-body text-[11px] font-semibold uppercase tracking-wide',
                        today ? 'text-amber-600' : 'text-zinc-400'
                      )}
                    >
                      {format(day, 'EEE')}
                    </p>
                    <p
                      className={cn(
                        'font-display text-base font-semibold mt-0.5',
                        today ? 'text-amber-600' : 'text-zinc-900'
                      )}
                    >
                      {format(day, 'd')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Slot rows */}
            {SLOTS.map((slot, slotIdx) => (
              <div
                key={slot.id}
                className={cn(
                  'grid grid-cols-[88px_repeat(7,1fr)]',
                  slotIdx < 2 && 'border-b border-zinc-50'
                )}
              >
                <div className="px-3 py-4 flex items-center">
                  <p className="font-body text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                    {slot.label}
                  </p>
                </div>

                {weekDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const session = getSession(dateKey, slot.id);
                  const isActive =
                    activeCell?.dateKey === dateKey && activeCell?.slot === slot.id;
                  const today = isToday(day);
                  const cfg = session ? SESSION_CONFIGS[session] : null;

                  return (
                    <div
                      key={dateKey}
                      className={cn(
                        'px-1.5 py-2.5 flex items-center justify-center',
                        today && 'bg-amber-50/40'
                      )}
                    >
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => handleCellClick(dateKey, slot.id)}
                        className={cn(
                          'w-full min-h-[42px] rounded-xl text-center transition-all',
                          isActive && 'ring-2 ring-amber-400 ring-offset-1',
                          cfg
                            ? cn(cfg.bg, 'px-1 py-1.5')
                            : 'border border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                        )}
                      >
                        {cfg ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-base leading-tight">{cfg.emoji}</span>
                            <span className={cn('font-body text-[10px] font-semibold', cfg.color)}>
                              {cfg.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-300 text-base leading-none">+</span>
                        )}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Session picker panel */}
      <AnimatePresence>
        {activeCell && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-sm font-medium text-zinc-700">
                {activeDayDate && format(activeDayDate, 'EEEE, MMM d')} —{' '}
                <span className="capitalize">{activeCell.slot}</span>
              </p>
              <button
                onClick={() => setActiveCell(null)}
                className="w-6 h-6 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors"
              >
                <X size={13} className="text-zinc-500" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.entries(SESSION_CONFIGS) as [SessionType, (typeof SESSION_CONFIGS)[SessionType]][]).map(
                ([type, cfg]) => (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => assignSession(activeCell.dateKey, activeCell.slot, type)}
                    className={cn(
                      'px-3 py-2 rounded-full font-body text-sm font-medium transition-all flex items-center gap-1.5',
                      cfg.bg,
                      cfg.color,
                      activeCellSession === type && 'ring-2 ring-amber-400 ring-offset-1'
                    )}
                  >
                    {cfg.emoji} {cfg.label}
                  </motion.button>
                )
              )}
              {activeCellSession && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => clearSession(activeCell.dateKey, activeCell.slot)}
                  className="px-3 py-2 rounded-full font-body text-sm font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  ✕ Clear
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-3"
      >
        {Object.entries(SESSION_CONFIGS).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5">
            <span className="text-sm">{cfg.emoji}</span>
            <span className="font-body text-xs text-zinc-500">{cfg.label}</span>
          </div>
        ))}
        <span className="font-body text-xs text-zinc-400 ml-auto">Tap a cell to add or change</span>
      </motion.div>
    </div>
  );
}
