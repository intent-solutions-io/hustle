'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Target, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIInsightCard } from '@/components/ui/ai-insight-card';

// ─── Formations ───────────────────────────────────────────────
interface Formation {
  id: string;
  label: string;
  description: string;
  strengths: string[];
  tactics: string[];
}

const FORMATIONS: Formation[] = [
  {
    id: '4-3-3',
    label: '4-3-3',
    description: 'High-pressing attack with three forwards',
    strengths: ['Wide attacking play', 'High press', 'Fullback overlaps'],
    tactics: [
      'Press aggressively from the front three — trigger on the goalkeeper',
      'Fullbacks attack to create wide overloads and deliver early crosses',
      'Central midfielder drops to form a double pivot when out of possession',
      'Wingers cut inside to create space for overlapping fullbacks',
    ],
  },
  {
    id: '4-4-2',
    label: '4-4-2',
    description: 'Balanced shape with two up front',
    strengths: ['Partnership up front', 'Midfield compact block', 'Counter-attack'],
    tactics: [
      'Two strikers press in tandem — stay narrow to block central passes',
      'Midfield four holds a flat shape, shift quickly side to side',
      'Wide midfielders track back to form a compact defensive line of six',
      'Exploit second balls from the striker holding play up top',
    ],
  },
  {
    id: '3-5-2',
    label: '3-5-2',
    description: 'Wing-back system with midfield control',
    strengths: ['Midfield overload', 'Wing-back width', 'Three-man defense'],
    tactics: [
      'Wing-backs provide all the width — they must have high stamina',
      'Three center backs stay compact; one steps to press when needed',
      'Control central midfield with numbers — dominate possession',
      'Two strikers combine: one holds up, one runs in behind',
    ],
  },
  {
    id: '4-2-3-1',
    label: '4-2-3-1',
    description: 'Control and defensive solidity',
    strengths: ['Double pivot protection', 'Creative #10 space', 'Hard to break down'],
    tactics: [
      'Double pivot screens the defense — one holds while the other joins play',
      'Number 10 links midfield to striker, drops deep to receive and turn',
      'Wide attackers stretch play wide and overload with fullbacks',
      'Lone striker makes intelligent runs, holds ball, and draws fouls',
    ],
  },
  {
    id: '5-3-2',
    label: '5-3-2',
    description: 'Defensive structure with counter potential',
    strengths: ['Defensive solidity', 'Five-man backline', 'Fast transitions'],
    tactics: [
      'Five defenders stay disciplined — wing-backs only attack on transition',
      'Midfield trio is compact; press as a unit when ball is won high',
      'On winning the ball, release wing-backs immediately into space',
      'Two strikers must be clinical — chances are fewer, quality matters most',
    ],
  },
];

// ─── Player positions ─────────────────────────────────────────
// SVG viewBox: "0 0 300 452". Pitch: y=12→440. Attack at top (y≈12), GK at bottom (y≈440).
interface Player { x: number; y: number; label: string }

const FORMATION_POSITIONS: Record<string, Player[]> = {
  '4-3-3': [
    { x: 150, y: 422, label: 'GK' },
    { x: 242, y: 352, label: 'RB' }, { x: 193, y: 366, label: 'CB' },
    { x: 107, y: 366, label: 'CB' }, { x: 58,  y: 352, label: 'LB' },
    { x: 222, y: 248, label: 'CM' }, { x: 150, y: 230, label: 'CM' }, { x: 78, y: 248, label: 'CM' },
    { x: 252, y: 118, label: 'RW' }, { x: 150, y: 98,  label: 'ST' }, { x: 48, y: 118, label: 'LW' },
  ],
  '4-4-2': [
    { x: 150, y: 422, label: 'GK' },
    { x: 242, y: 352, label: 'RB' }, { x: 193, y: 366, label: 'CB' },
    { x: 107, y: 366, label: 'CB' }, { x: 58,  y: 352, label: 'LB' },
    { x: 254, y: 250, label: 'RM' }, { x: 188, y: 230, label: 'CM' },
    { x: 112, y: 230, label: 'CM' }, { x: 46,  y: 250, label: 'LM' },
    { x: 192, y: 100, label: 'ST' }, { x: 108, y: 100, label: 'ST' },
  ],
  '3-5-2': [
    { x: 150, y: 422, label: 'GK' },
    { x: 212, y: 358, label: 'CB' }, { x: 150, y: 370, label: 'CB' }, { x: 88, y: 358, label: 'CB' },
    { x: 264, y: 248, label: 'RWB' }, { x: 205, y: 228, label: 'CM' },
    { x: 150, y: 215, label: 'CM' }, { x: 95,  y: 228, label: 'CM' }, { x: 36, y: 248, label: 'LWB' },
    { x: 192, y: 100, label: 'ST' }, { x: 108, y: 100, label: 'ST' },
  ],
  '4-2-3-1': [
    { x: 150, y: 422, label: 'GK' },
    { x: 242, y: 352, label: 'RB' }, { x: 193, y: 366, label: 'CB' },
    { x: 107, y: 366, label: 'CB' }, { x: 58,  y: 352, label: 'LB' },
    { x: 196, y: 278, label: 'DM'  }, { x: 104, y: 278, label: 'DM'  },
    { x: 242, y: 168, label: 'RAM' }, { x: 150, y: 155, label: 'CAM' }, { x: 58, y: 168, label: 'LAM' },
    { x: 150, y: 95,  label: 'ST'  },
  ],
  '5-3-2': [
    { x: 150, y: 422, label: 'GK' },
    { x: 266, y: 330, label: 'RWB' }, { x: 208, y: 362, label: 'CB' },
    { x: 150, y: 372, label: 'CB'  }, { x: 92,  y: 362, label: 'CB' }, { x: 34, y: 330, label: 'LWB' },
    { x: 210, y: 230, label: 'CM'  }, { x: 150, y: 215, label: 'CM' }, { x: 90, y: 230, label: 'CM'  },
    { x: 192, y: 100, label: 'ST'  }, { x: 108, y: 100, label: 'ST' },
  ],
};

// ─── Pitch diagram ────────────────────────────────────────────
function PitchDiagram({ formationId }: { formationId: string }) {
  const players = FORMATION_POSITIONS[formationId] ?? FORMATION_POSITIONS['4-3-3'];

  // Shared SVG prop sets
  const L = { stroke: 'white', strokeWidth: 1.5, fill: 'none', strokeOpacity: 0.65 };
  const S = { fill: 'white', fillOpacity: 0.7 };

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl">
      <svg viewBox="0 0 300 452" xmlns="http://www.w3.org/2000/svg" className="w-full block">
        <defs>
          {/* Alternating grass stripes */}
          <pattern id="grass" x="0" y="0" width="300" height="32" patternUnits="userSpaceOnUse">
            <rect width="300" height="16" fill="#1e7c35" />
            <rect y="16" width="300" height="16" fill="#1a7030" />
          </pattern>
          {/* Clip masks to show penalty arcs only outside the boxes */}
          <clipPath id="cp-top-arc">
            <rect x="0" y="80" width="300" height="372" />
          </clipPath>
          <clipPath id="cp-bot-arc">
            <rect x="0" y="12" width="300" height="360" />
          </clipPath>
        </defs>

        {/* ── Pitch background ── */}
        <rect x="0" y="12" width="300" height="428" fill="url(#grass)" />

        {/* ── Goals (white-outlined rectangles beyond goal lines) ── */}
        <rect x="119" y="0"   width="62" height="14"
          stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.06)" strokeOpacity="0.85" />
        <rect x="119" y="438" width="62" height="14"
          stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.06)" strokeOpacity="0.85" />

        {/* ── Pitch boundary ── */}
        <rect x="0" y="12" width="300" height="428" {...L} />

        {/* ── Halfway line ── */}
        <line x1="0" y1="226" x2="300" y2="226" {...L} />

        {/* ── Centre circle + spot ── */}
        <circle cx="150" cy="226" r="40" {...L} />
        <circle cx="150" cy="226" r="2.5" {...S} />

        {/* ── Penalty boxes ── */}
        <rect x="61" y="12"  width="178" height="68" {...L} />
        <rect x="61" y="360" width="178" height="68" {...L} />

        {/* ── 6-yard boxes ── */}
        <rect x="110" y="12"  width="80" height="23" {...L} />
        <rect x="110" y="417" width="80" height="23" {...L} />

        {/* ── Penalty spots ── */}
        <circle cx="150" cy="57"  r="2.5" {...S} />
        <circle cx="150" cy="383" r="2.5" {...S} />

        {/* ── Penalty arcs (D-mark) ── */}
        {/* Top: arc bulges downward out of the box. Centre=(150,57), r=40.
            Intersects y=80 at x≈117 and x≈183. */}
        <path d="M 183,80 A 40,40 0 0,0 117,80" {...L} clipPath="url(#cp-top-arc)" />
        {/* Bottom: arc bulges upward out of the box. Centre=(150,383), r=40.
            Intersects y=360 at x≈117 and x≈183. */}
        <path d="M 117,360 A 40,40 0 0,1 183,360" {...L} clipPath="url(#cp-bot-arc)" />

        {/* ── Corner arcs (r=6) ── */}
        <path d="M 0,18  A 6,6 0 0,1 6,12"    {...L} />
        <path d="M 294,12 A 6,6 0 0,1 300,18"  {...L} />
        <path d="M 6,440  A 6,6 0 0,1 0,434"   {...L} />
        <path d="M 300,434 A 6,6 0 0,1 294,440" {...L} />

        {/* ── Players ── */}
        {players.map((p, i) => (
          <motion.g
            key={i}
            initial={{ x: p.x, y: p.y }}
            animate={{ x: p.x, y: p.y }}
            transition={{ type: 'spring', stiffness: 200, damping: 26, delay: i * 0.025 }}
          >
            {/* Outer glow ring for GK */}
            {i === 0 && (
              <circle cx={0} cy={0} r={17} fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
            )}
            <circle
              cx={0} cy={0} r={13}
              fill={i === 0 ? '#fbbf24' : '#f59e0b'}
              stroke="white"
              strokeWidth="1.5"
            />
            <text
              x={0} y={0}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={p.label.length > 2 ? 6 : 7}
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {p.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

// ─── Checklist ────────────────────────────────────────────────
const CHECKLIST = [
  'Hydrate well for 24 hours before the match',
  'Sleep 8+ hours the night before kick-off',
  'Eat a carbohydrate-rich meal 3 hours before',
  'Arrive early — warm up 20 minutes before kick-off',
  'Review the opponent\'s formation and set pieces',
  'Visualize key moments and your best performance',
];

// ─── Page ─────────────────────────────────────────────────────
export default function StrategyPage() {
  const [selected, setSelected] = useState(FORMATIONS[0]);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [opponentNotes, setOpponentNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Unique position labels for the selected formation (preserves order, excludes GK)
  const positionOptions = Array.from(
    new Set(
      (FORMATION_POSITIONS[selected.id] ?? [])
        .map((p) => p.label)
        .filter((l) => l !== 'GK')
    )
  );

  const handleFormationChange = (f: Formation) => {
    setSelected(f);
    setSelectedPosition('');
  };

  const toggleCheck = (idx: number) => {
    const next = new Set(checkedItems);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCheckedItems(next);
  };

  const handleSaveNotes = () => {
    if (!opponentNotes.trim()) return;
    console.log('Opponent notes:', opponentNotes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
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
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-zinc-900">Strategy</h2>
            <p className="font-body text-sm text-zinc-500">Formation tactics and match prep</p>
          </div>
        </div>
      </motion.div>

      {/* Formation selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      >
        {FORMATIONS.map((f) => (
          <button
            key={f.id}
            onClick={() => handleFormationChange(f)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full font-display text-sm font-semibold transition-colors',
              selected.id === f.id
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 shadow-sm'
            )}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Position selector */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <span className="font-body text-xs text-zinc-400 shrink-0">Your position:</span>
        {positionOptions.map((pos) => (
          <button
            key={pos}
            onClick={() => setSelectedPosition(selectedPosition === pos ? '' : pos)}
            className={cn(
              'px-3 py-1 rounded-full font-display text-xs font-semibold transition-colors',
              selectedPosition === pos
                ? 'bg-green-600 text-white'
                : 'bg-white text-zinc-500 hover:bg-zinc-100 shadow-sm'
            )}
          >
            {pos}
          </button>
        ))}
      </motion.div>

      {/* Formation detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5"
        >
          {/* Pitch diagram */}
          <div className="relative">
            <PitchDiagram formationId={selected.id} />
            <p className="text-center font-display text-lg font-semibold text-zinc-900 mt-2">
              {selected.label}
            </p>
          </div>

          {/* Tactics info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="font-body text-sm text-zinc-500 mb-3">{selected.description}</p>

            <div className="mb-4">
              <p className="font-display text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Strengths
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.strengths.map((s) => (
                  <span
                    key={s}
                    className="font-body text-xs font-medium px-2.5 py-1 bg-green-50 text-green-700 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-display text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Key Tactics
              </p>
              <div className="space-y-2">
                {selected.tactics.map((tactic, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="font-display text-xs font-semibold text-green-600 bg-green-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="font-body text-sm text-zinc-700">{tactic}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* AI tactical recommendations */}
      <motion.div
        key={`ai-${selected.id}-${selectedPosition}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <AIInsightCard
          type="strategy"
          title="AI Tactical Recommendations"
          context={{
            formation:     selected.label,
            description:   selected.description,
            position:      selectedPosition || undefined,
            opponentNotes: opponentNotes.trim() || undefined,
          }}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pre-match checklist */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-zinc-900">Pre-Match Checklist</h3>
            <span className="font-body text-xs text-zinc-400">
              {checkedItems.size}/{CHECKLIST.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-zinc-100 rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-green-500 rounded-full"
              animate={{ width: `${(checkedItems.size / CHECKLIST.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          <div className="space-y-2">
            {CHECKLIST.map((item, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleCheck(i)}
                className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors text-left"
              >
                {checkedItems.has(i) ? (
                  <CheckSquare size={18} className="text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <Square size={18} className="text-zinc-300 shrink-0 mt-0.5" />
                )}
                <p
                  className={cn(
                    'font-body text-sm transition-colors',
                    checkedItems.has(i) ? 'text-zinc-400 line-through' : 'text-zinc-700'
                  )}
                >
                  {item}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Opponent notes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="bg-white rounded-2xl p-5 shadow-sm flex flex-col"
        >
          <h3 className="font-display text-base font-semibold text-zinc-900 mb-1">
            Opponent Notes
          </h3>
          <p className="font-body text-xs text-zinc-400 mb-3">
            Key observations about the next opponent
          </p>
          <textarea
            value={opponentNotes}
            onChange={(e) => {
              setOpponentNotes(e.target.value);
              setNotesSaved(false);
            }}
            rows={6}
            placeholder="e.g. Fast left winger, strong in set pieces, weak at pressing high. Their #7 likes to cut inside — track carefully..."
            className="flex-1 w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 font-body text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 placeholder:text-zinc-300 resize-none transition-colors mb-3"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveNotes}
            disabled={!opponentNotes.trim()}
            className={cn(
              'w-full py-2.5 rounded-full font-display font-semibold text-sm transition-colors',
              notesSaved
                ? 'bg-green-500 text-white'
                : opponentNotes.trim()
                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            )}
          >
            {notesSaved ? '✓ Saved' : 'Save Notes'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
