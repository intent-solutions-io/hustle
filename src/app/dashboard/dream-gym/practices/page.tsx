'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Star,
  Footprints,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { getPracticeAnimation } from '@/lib/dream-gym/exercise-animations';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────
interface DrillWithSteps {
  id: string;
  name: string;
  focusArea: string;
  duration: string;
  durationSeconds: number;
  description: string;
  intensity: 'Low' | 'Medium' | 'High';
  emoji: string;
  steps: string[];
  xp: number;
  friendlyIntro: string;
}

type DrillPhase = 'intro' | 'steps' | 'complete';

// ─── Focus areas ──────────────────────────────────────────────
const focusAreas: Array<{ label: string; emoji: string; greeting: string }> = [
  { label: 'Passing',     emoji: '⚽', greeting: "Let's practice passing!" },
  { label: 'Shooting',    emoji: '🥅', greeting: 'Time to score some goals!' },
  { label: 'Dribbling',   emoji: '💨', greeting: 'Show off your moves!' },
  { label: 'First Touch', emoji: '🎯', greeting: 'Master your first touch!' },
  { label: 'Heading',     emoji: '👆', greeting: 'Head it in!' },
  { label: 'Positioning', emoji: '🗺️',  greeting: 'Find the perfect spot!' },
  { label: 'Scrimmage',   emoji: '🏆', greeting: "Game time!" },
  { label: 'Goalkeeping', emoji: '🧤', greeting: 'Guard that goal!' },
];

// ─── Drills ───────────────────────────────────────────────────
const drillsByFocus: Record<string, DrillWithSteps[]> = {
  Passing: [
    {
      id: 'p1', name: 'Triangle Passing', focusArea: 'Passing',
      duration: '15 min', durationSeconds: 900, intensity: 'Low',
      description: 'Three players in a triangle, one-touch passing. Focus on weight and body position.',
      emoji: '🔺', xp: 150,
      friendlyIntro: "Get in a triangle with your teammates and pass that ball! ⚽",
      steps: [
        "Stand in a triangle shape with two friends — about 5 big steps apart 🔺",
        "Pass using the inside of your foot — nice and smooth!",
        "Move your feet as soon as you pass — don't just stand there! 🏃",
        "Try to pass with ONE touch only. Quick quick quick! ⚡",
        "Keep your head up — look at teammates before the ball arrives! 👀",
      ],
    },
    {
      id: 'p2', name: 'Rondo 4v1', focusArea: 'Passing',
      duration: '10 min', durationSeconds: 600, intensity: 'Medium',
      description: 'Keep possession against one defender. Quick decisions and movement.',
      emoji: '⭕', xp: 120,
      friendlyIntro: "4 vs 1 — keep the ball away from the defender! 😈",
      steps: [
        "Make a circle with 4 players. One brave person goes in the middle! 😤",
        "Pass around the circle fast — don't let the middle player touch it!",
        "If the middle player gets it, you swap with them! 😬",
        "Move after you pass — give your teammate somewhere to pass to",
        "Can you get 10 passes in a row? Let's count! 🔢",
      ],
    },
    {
      id: 'p3', name: 'Long Switch Passes', focusArea: 'Passing',
      duration: '10 min', durationSeconds: 600, intensity: 'Low',
      description: 'Switch play with driven passes across the pitch.',
      emoji: '↔️', xp: 100,
      friendlyIntro: "Big long passes! Switch the play like a pro! 🌟",
      steps: [
        "You on one side, partner on the far other side 📏",
        "Plant your standing foot right next to the ball",
        "Hit through the middle of the ball with your laces — BOOM! 💥",
        "Aim for your partner's feet. No chasing crazy balls!",
        "Switch and repeat. Back and forth all drill! 🔄",
      ],
    },
  ],
  Shooting: [
    {
      id: 's1', name: 'Finishing from Cutback', focusArea: 'Shooting',
      duration: '15 min', durationSeconds: 900, intensity: 'Medium',
      description: 'Receive cutback passes and shoot first time.',
      emoji: '🎯', xp: 150,
      friendlyIntro: "Get in position and smash it into the net! 🥅",
      steps: [
        "Stand 12 big steps from goal, just inside the box ⬜",
        "Your partner runs to the corner of the box with the ball",
        "Watch carefully — they're going to cut it back to you!",
        "When the ball comes, hit it FIRST TOUCH — no second chances!",
        "Aim low and into the corners. Pick your spot early! 🎯",
      ],
    },
    {
      id: 's2', name: '1v1 with Keeper', focusArea: 'Shooting',
      duration: '20 min', durationSeconds: 1200, intensity: 'High',
      description: 'Attack through balls, face goalkeeper 1v1.',
      emoji: '🏃', xp: 200,
      friendlyIntro: "Just you and the keeper — stay cool and score! 😤",
      steps: [
        "Start 30 steps from goal. Ball gets played in behind for you 🏃",
        "Sprint onto the ball — don't slow down!",
        "As you get close, look up to see where the keeper is",
        "Keeper coming out big? Chip or go around them! 🧠",
        "Keeper staying back? Pick a corner and shoot LOW. Breathe! 💨",
      ],
    },
    {
      id: 's3', name: 'Set Piece Shooting', focusArea: 'Shooting',
      duration: '15 min', durationSeconds: 900, intensity: 'Medium',
      description: 'Free kick practice inside and outside the box.',
      emoji: '🌀', xp: 150,
      friendlyIntro: "Curl it like a free kick specialist! 🌀",
      steps: [
        "Place the ball 20 steps from goal, slightly to the side ⬜",
        "Take 3 steps back and 1 step to the side of the ball",
        "Approach at an angle — body pointing away from goal",
        "Strike with the inside of your foot, wrap right around the ball 🌀",
        "Follow through and watch it bend into the top corner! ✨",
      ],
    },
  ],
  Dribbling: [
    {
      id: 'd1', name: 'Cone Slalom', focusArea: 'Dribbling',
      duration: '10 min', durationSeconds: 600, intensity: 'Low',
      description: 'Weave through 10 cones with both feet alternating.',
      emoji: '🚧', xp: 100,
      friendlyIntro: "Weave through the cones like a ninja! 🥷",
      steps: [
        "Set up 10 cones in a line, 1 big step apart 🚧",
        "Dribble through using your RIGHT foot only — all the way down!",
        "Come back using your LEFT foot only. Tricky! 😅",
        "Now use BOTH feet — alternate every touch. Can you do it?",
        "Speed round! Go as fast as you can while staying in control! 💨",
      ],
    },
    {
      id: 'd2', name: '1v1 Skill Moves', focusArea: 'Dribbling',
      duration: '15 min', durationSeconds: 900, intensity: 'High',
      description: 'Cruyff turn, step-over, and scissors in 1v1 situations.',
      emoji: '✨', xp: 180,
      friendlyIntro: "Learn sick skill moves and destroy defenders! 🔥",
      steps: [
        "Cruyff Turn — drag the ball back with the inside of your foot 🔄",
        "Step-over — circle your foot around the ball, then burst away!",
        "Scissors — one foot swings over, burst the other way! ✂️",
        "Now face a real defender! Pick ONE skill and try it 💪",
        "Mix it up — pretend one way, go the other. Defenders hate this! 😈",
      ],
    },
    {
      id: 'd3', name: 'Speed Dribbling', focusArea: 'Dribbling',
      duration: '10 min', durationSeconds: 600, intensity: 'High',
      description: 'Carry the ball at pace and change direction on signal.',
      emoji: '⚡', xp: 120,
      friendlyIntro: "Dribble at full speed! Nobody can catch you! ⚡",
      steps: [
        "Dribble forward at full speed — keep the ball just ahead of you 🏃",
        "When someone shouts 'CHANGE!' — change direction instantly! 🔄",
        "Use the outside of your foot to push the ball sideways when turning",
        "Stay low when you change direction — helps you turn faster!",
        "Race a friend. First one to the end wins! 🏆",
      ],
    },
  ],
  'First Touch': [
    {
      id: 'ft1', name: 'Wall Rebound Control', focusArea: 'First Touch',
      duration: '15 min', durationSeconds: 900, intensity: 'Low',
      description: 'Drive ball into wall and control first touch.',
      emoji: '🧱', xp: 130,
      friendlyIntro: "The wall is your best training partner! 🧱",
      steps: [
        "Stand 4 big steps from a wall and kick the ball at it firmly 🧱",
        "Watch the ball ALL the way back — eyes on the ball!",
        "Control with the inside of your foot. CUSHION it, don't stab! 🦶",
        "Make sure your first touch goes forward — ready for the next move",
        "Try different angles and speeds. How fast can you go? ⏩",
      ],
    },
    {
      id: 'ft2', name: 'Juggling Sequence', focusArea: 'First Touch',
      duration: '10 min', durationSeconds: 600, intensity: 'Low',
      description: 'Juggle with both feet, thighs, and chest in sequence.',
      emoji: '🤹', xp: 100,
      friendlyIntro: "Keep the ball in the air! How many can you do? 🤹",
      steps: [
        "Just your stronger foot first. Count every single touch! 🔢",
        "Now try your weaker foot. Weird at first — that's totally okay! 😄",
        "Alternate feet: right, left, right, left... find your rhythm 🎵",
        "Add your thigh! Foot → thigh → foot → thigh...",
        "Challenge: 20 without dropping! 20 is the magic number! ⭐",
      ],
    },
    {
      id: 'ft3', name: 'Chest Control to Pass', focusArea: 'First Touch',
      duration: '10 min', durationSeconds: 600, intensity: 'Medium',
      description: 'Receive lofted balls on chest, then pass accurately.',
      emoji: '💪', xp: 120,
      friendlyIntro: "Puff your chest out and control it like a pro! 💪",
      steps: [
        "Partner throws a high ball toward your chest — get in position early!",
        "Open your chest and lean back slightly as it arrives",
        "Let the ball hit your chest and DROP — cushion it softly! 🪶",
        "As it falls, get your foot ready to pass immediately",
        "Pass it back accurately — one smooth movement! ⚽",
      ],
    },
  ],
  Heading: [
    {
      id: 'h1', name: 'Crossing & Heading', focusArea: 'Heading',
      duration: '15 min', durationSeconds: 900, intensity: 'High',
      description: 'Deliver crosses, practice glancing headers toward goal.',
      emoji: '🎪', xp: 180,
      friendlyIntro: "Time the run and head it into the net! 🏹",
      steps: [
        "Partner on the wing, you start in the penalty box 🗺️",
        "Watch the crosser's run — time YOUR run to arrive with the ball! ⏰",
        "Jump off ONE foot for height — like a basketball lay-up!",
        "Use your FOREHEAD, not the top of your head. Eyes open! 👁️",
        "Direct the ball DOWN toward goal. Down = harder to save! 🥅",
      ],
    },
    {
      id: 'h2', name: 'Defensive Heading', focusArea: 'Heading',
      duration: '10 min', durationSeconds: 600, intensity: 'High',
      description: 'Clear set pieces and win aerial duels.',
      emoji: '🛡️', xp: 150,
      friendlyIntro: "Defend your box like a warrior! 🛡️",
      steps: [
        "Stand near the penalty spot — THIS is your area! 💪",
        "Partner lofts the ball into the box — call 'MINE!' loud! 📢",
        "Attack the ball — go TO it, don't wait for it!",
        "Head with your forehead, aim UP and AWAY from danger ↗️",
        "Land, look up, get back in position fast. You're not done! 🏃",
      ],
    },
  ],
  Positioning: [
    {
      id: 'po1', name: 'Shadow Play', focusArea: 'Positioning',
      duration: '15 min', durationSeconds: 900, intensity: 'Medium',
      description: 'Team movement without the ball — spacing and timing.',
      emoji: '👻', xp: 150,
      friendlyIntro: "Move like a ghost! Smart runs, no ball needed! 👻",
      steps: [
        "Your team lines up in formation — no ball yet! Just positions 🗺️",
        "Coach calls a direction — EVERYONE shifts together! ↔️",
        "Spot empty space — when a teammate moves there, YOU find new space!",
        "Practice the run in behind — sprint past the last defender at the right moment!",
        "Now add the ball! Try to replicate everything you just practiced ⚽",
      ],
    },
    {
      id: 'po2', name: 'Pressing Triggers', focusArea: 'Positioning',
      duration: '10 min', durationSeconds: 600, intensity: 'Medium',
      description: 'Identify when to press and coordinate team pressure.',
      emoji: '🎯', xp: 120,
      friendlyIntro: "Trap the ball together like a team! Press! 💥",
      steps: [
        "Watch the ball — bad touch from the defender = TRIGGER! 🚨",
        "Striker presses first, midfielders close the lanes behind",
        "Cut off the easy pass — force them backward or sideways",
        "Stay compact — don't all chase the ball! Someone covers behind 🤝",
        "Win it HIGH and counter immediately! ⚡",
      ],
    },
    {
      id: 'po3', name: 'Transition Shape', focusArea: 'Positioning',
      duration: '10 min', durationSeconds: 600, intensity: 'High',
      description: 'React quickly on possession turnover.',
      emoji: '🔄', xp: 140,
      friendlyIntro: "Ball lost? Sprint back IMMEDIATELY! No walking! 🏃",
      steps: [
        "Your team has the ball — now pretend you JUST lost it! 😱",
        "EVERYONE sprints back 5 steps instantly — no thinking, just GO!",
        "Get between the ball and your goal — block their lanes",
        "Find your man — who are you marking? Point at them! 👉",
        "Hold shape together — press when the trigger happens again! 💪",
      ],
    },
  ],
  Scrimmage: [
    {
      id: 'sc1', name: '5v5 Small Sided Game', focusArea: 'Scrimmage',
      duration: '20 min', durationSeconds: 1200, intensity: 'High',
      description: 'High-tempo game on a small pitch.',
      emoji: '⚡', xp: 250,
      friendlyIntro: "Game time! Play hard, have fun, give 100%! ⚡",
      steps: [
        "Set up a small pitch — about 30 steps long, 20 wide ⬜",
        "Teams of 5! Every player is on the pitch — no hiding! 😄",
        "Play hard but fair — lots of touches, lots of running!",
        "Talk to your teammates — 'Man on!', 'Turn!', 'Through ball!' 🗣️",
        "After 10 minutes, swap sides. Best of 2 rounds wins! 🏆",
      ],
    },
    {
      id: 'sc2', name: 'Possession Scrimmage', focusArea: 'Scrimmage',
      duration: '15 min', durationSeconds: 900, intensity: 'High',
      description: 'Maintain possession — must complete 3 passes to score.',
      emoji: '🔗', xp: 200,
      friendlyIntro: "Keep the ball — 3 passes before you can score! 🔗",
      steps: [
        "Play a normal scrimmage but with ONE special rule 📋",
        "You MUST complete 3 passes before shooting on goal!",
        "Count out loud as a team: ONE! TWO! THREE! SHOOT! 📢",
        "Lose the ball before 3 passes? Your count resets to zero!",
        "Last 5 minutes: 5 passes to score! Gets REALLY tricky! 🧠",
      ],
    },
  ],
  Goalkeeping: [
    {
      id: 'gk1', name: 'Shot Stopping', focusArea: 'Goalkeeping',
      duration: '15 min', durationSeconds: 900, intensity: 'High',
      description: 'Shots from various positions — diving saves and positioning.',
      emoji: '🧤', xp: 200,
      friendlyIntro: "Nothing gets past you! Be the wall! 🧱",
      steps: [
        "Stand in the middle of goal — big stance, weight on your toes! 🦵",
        "Partner shoots from straight on — get your body BEHIND the ball!",
        "Shots to the side → dive! Push off your standing foot hard 💪",
        "Catch or HOLD the ball — no rebounds for the striker!",
        "Now shots from angles too — come off your line to cut the angle! 📐",
      ],
    },
    {
      id: 'gk2', name: 'Distribution', focusArea: 'Goalkeeping',
      duration: '10 min', durationSeconds: 600, intensity: 'Medium',
      description: 'Goal kicks, throws, and half-volleys to outfield players.',
      emoji: '🎯', xp: 150,
      friendlyIntro: "Be the team's first attacker! Distribute like a boss! 🎯",
      steps: [
        "Short throw first — roll it smoothly to a nearby defender 🤜",
        "Overarm throw to the midfielder — find the open player!",
        "Half-volley! Drop the ball and kick it as it bounces — BOOM! 💥",
        "Goal kick from the ground — open hips, keep your head down! ⬇️",
        "Look up BEFORE kicking — see where teammates are! 👀",
      ],
    },
  ],
};

const intensityStyles: Record<string, { bg: string; text: string }> = {
  Low:    { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Medium: { bg: 'bg-amber-50',   text: 'text-amber-700'   },
  High:   { bg: 'bg-red-50',     text: 'text-red-700'     },
};

// ─── Sound ────────────────────────────────────────────────────
function playSound(type: 'next' | 'complete' | 'xp') {
  if (typeof window === 'undefined') return;
  try {
    type WinWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = (window as WinWithWebkit).webkitAudioContext ?? window.AudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    const t = ctx.currentTime;

    if (type === 'next') {
      osc.frequency.setValueAtTime(660, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'complete') {
      osc.frequency.setValueAtTime(523.25, t);
      osc.frequency.setValueAtTime(659.25, t + 0.12);
      osc.frequency.setValueAtTime(783.99, t + 0.24);
      osc.frequency.setValueAtTime(1046.5,  t + 0.40);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t); osc.stop(t + 0.8);
    } else {
      osc.frequency.setValueAtTime(880,    t);
      osc.frequency.setValueAtTime(1108.73, t + 0.07);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
    }
  } catch { /* AudioContext blocked or unavailable */ }
}

// ─── TimerRing ────────────────────────────────────────────────
function TimerRing({
  total, elapsed, size = 128,
}: { total: number; elapsed: number; size?: number }) {
  const sw = 10;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const remaining = Math.max(0, total - elapsed);
  const pct = remaining / total;
  const offset = circ * (1 - pct);
  const color = pct > 0.5 ? '#10b981' : pct > 0.2 ? '#f59e0b' : '#ef4444';
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size} height={size}
        className="absolute"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#f4f4f5" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
        />
      </svg>
      <div className="z-10 flex flex-col items-center leading-none">
        <span className="font-display text-2xl font-bold text-zinc-900">
          {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs}
        </span>
        <span className="font-body text-[10px] text-zinc-400 mt-0.5">left</span>
      </div>
    </div>
  );
}

// ─── ConfettiBurst ────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#ec4899',
  '#8b5cf6', '#f97316', '#ef4444', '#06b6d4',
];

function ConfettiBurst({ active }: { active: boolean }) {
  // Deterministic particles via golden-angle distribution — no Math.random() needed
  const particles = useMemo(() =>
    Array.from({ length: 52 }, (_, i) => {
      const angle = (i * 137.508) % 360;
      const rad = (angle * Math.PI) / 180;
      const dist = 110 + (i % 5) * 48;
      return {
        id: i,
        x: (i * 1.94) % 100,
        dx: Math.cos(rad) * dist,
        dy: -Math.abs(Math.sin(rad) * dist) - 70,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: i % 3 === 2 ? (6 + (i % 4) * 2) * 2 : 6 + (i % 4) * 2,
        h: 6 + (i % 4) * 2,
        radius: i % 3 === 0 ? '50%' : '3px',
        rotate: angle * 4,
        dur: 1.1 + (i % 5) * 0.13,
        delay: (i % 9) * 0.035,
      };
    }), []
  );

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '55%',
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.radius,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: p.dx,
            y: p.dy,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0.4],
            rotate: p.rotate,
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ─── StepDots ─────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            width:           i === current ? 20 : 8,
            height:          8,
            backgroundColor: i < current ? '#10b981' : i === current ? '#f59e0b' : '#e4e4e7',
          }}
          className="rounded-full"
          transition={{ duration: 0.25 }}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
interface PlayerOption {
  id: string;
  name: string;
}

export default function PracticesPage() {
  // Browse state
  const [activeFocus, setActiveFocus]   = useState('Passing');
  const [completedDrills, setCompleted] = useState<Set<string>>(new Set());
  const [totalXP, setTotalXP]           = useState(0);
  const [soundEnabled, setSound]        = useState(true);

  // Player selection for logging
  const [players, setPlayers]           = useState<PlayerOption[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  // Drill session state
  const [activeDrill, setActiveDrill] = useState<DrillWithSteps | null>(null);
  const [drillIndex,  setDrillIndex]  = useState(0);
  const [phase,       setPhase]       = useState<DrillPhase>('intro');
  const [stepIndex,   setStepIndex]   = useState(0);
  const [elapsed,     setElapsed]     = useState(0);
  const [showConfetti, setConfetti]   = useState(false);

  // Fetch players once on mount
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

  // Keep sound ref in sync so effects and timers always see fresh value
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const drills     = drillsByFocus[activeFocus] ?? [];
  const focusMeta  = focusAreas.find((f) => f.label === activeFocus)!;
  const doneCount  = drills.filter((d) => completedDrills.has(d.id)).length;

  // ── Timer helpers ─────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Auto-complete when timer hits zero ────────────────────
  const triggerComplete = useCallback(() => {
    stopTimer();
    setPhase('complete');
    setConfetti(true);
    if (soundRef.current) playSound('complete');
    setTimeout(() => setConfetti(false), 2500);
  }, [stopTimer]);

  useEffect(() => {
    if (!activeDrill || phase !== 'steps') return;
    if (elapsed >= activeDrill.durationSeconds) triggerComplete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  // ── Drill control ─────────────────────────────────────────
  const startDrill = (drill: DrillWithSteps, idx: number) => {
    stopTimer();
    setActiveDrill(drill);
    setDrillIndex(idx);
    setPhase('intro');
    setStepIndex(0);
    setElapsed(0);
  };

  const handleLetsGo = () => {
    setPhase('steps');
    startTimer();
  };

  const handleNextStep = () => {
    if (!activeDrill) return;
    if (soundRef.current) playSound('next');
    if (stepIndex < activeDrill.steps.length - 1) {
      setStepIndex((p) => p + 1);
    } else {
      triggerComplete();
    }
  };

  const handleCollectStars = () => {
    if (!activeDrill) return;
    if (soundRef.current) playSound('xp');
    setTotalXP((p) => p + activeDrill.xp);
    setCompleted((p) => new Set([...p, activeDrill.id]));

    // Save practice log to API if a player is selected
    if (selectedPlayerId) {
      const focusAreaKey = activeDrill.focusArea.toLowerCase().replace(/\s+/g, '_');
      const validFocusAreas = ['passing','shooting','dribbling','defending','heading','first_touch','positioning','set_pieces','goalkeeping','fitness','scrimmage','tactics','other'];
      const mappedFocus = validFocusAreas.includes(focusAreaKey) ? focusAreaKey : 'other';

      fetch('/api/practice-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayerId,
          date: new Date().toISOString(),
          practiceType: 'individual',
          durationMinutes: Math.max(5, Math.round(activeDrill.durationSeconds / 60)),
          focusAreas: [mappedFocus],
          drillsCompleted: [activeDrill.name],
          notes: activeDrill.description,
        }),
      }).catch(() => {}); // Non-blocking
    }

    setTimeout(() => { setActiveDrill(null); setPhase('intro'); }, 350);
  };

  const handleBack = () => {
    stopTimer();
    setActiveDrill(null);
    setPhase('intro');
  };

  // ─────────────────────────────────────────────────────────
  // ACTIVE DRILL VIEW
  // ─────────────────────────────────────────────────────────
  if (activeDrill) {
    const isLast  = stepIndex === activeDrill.steps.length - 1;
    const imgSrc  = getPracticeAnimation(activeDrill.focusArea);

    return (
      <>
        <ConfettiBurst active={showConfetti} />

        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 font-body text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <span className="font-body text-sm font-semibold text-zinc-500">
              Drill {drillIndex + 1} of {drills.length}
            </span>
            <button
              onClick={() => setSound((s) => !s)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label="Toggle sound"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          {/* Drill progress bar */}
          <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-400 rounded-full"
              animate={{
                width: `${((drillIndex + (phase === 'complete' ? 1 : 0)) / drills.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Phase content */}
          <AnimatePresence mode="wait">

            {/* ── INTRO ── */}
            {phase === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    className="text-7xl"
                  >
                    {activeDrill.emoji}
                  </motion.div>
                  <h2 className="font-display text-3xl font-bold text-zinc-900">
                    {activeDrill.name}
                  </h2>
                  <p className="font-body text-lg text-zinc-500 px-4">
                    {activeDrill.friendlyIntro}
                  </p>
                </div>

                {/* Animated drill image */}
                <div className="relative h-52 rounded-3xl overflow-hidden bg-zinc-50 shadow-sm">
                  <motion.div
                    animate={{ y: [0, -7, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0"
                  >
                    <Image src={imgSrc} alt={activeDrill.name} fill className="object-contain p-6" />
                  </motion.div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-amber-500">⭐ {activeDrill.xp}</p>
                    <p className="font-body text-xs text-zinc-400">XP Reward</p>
                  </div>
                  <div className="w-px h-10 bg-zinc-200" />
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-zinc-900">{activeDrill.duration}</p>
                    <p className="font-body text-xs text-zinc-400">Duration</p>
                  </div>
                  <div className="w-px h-10 bg-zinc-200" />
                  <div className="text-center">
                    <p className="font-display text-2xl font-bold text-zinc-900">{activeDrill.steps.length}</p>
                    <p className="font-body text-xs text-zinc-400">Steps</p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLetsGo}
                  className="w-full py-5 rounded-2xl bg-linear-to-r from-amber-400 to-orange-400 text-white font-display text-xl font-bold shadow-lg shadow-amber-200 flex items-center justify-center gap-3"
                >
                  <Play size={22} fill="white" />
                  Let&apos;s Go! 🚀
                </motion.button>
              </motion.div>
            )}

            {/* ── STEPS ── */}
            {phase === 'steps' && (
              <motion.div
                key="steps"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-5"
              >
                {/* Timer + step counter row */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="font-body text-xs font-semibold text-zinc-400 uppercase tracking-widest">Step</p>
                    <p className="font-display text-3xl font-bold text-zinc-900 leading-none">
                      {stepIndex + 1}
                      <span className="text-lg font-medium text-zinc-300">/{activeDrill.steps.length}</span>
                    </p>
                    <StepDots total={activeDrill.steps.length} current={stepIndex} />
                  </div>

                  <TimerRing total={activeDrill.durationSeconds} elapsed={elapsed} size={120} />

                  <div className="flex flex-col items-center gap-1.5">
                    <p className="font-body text-xs font-semibold text-zinc-400 uppercase tracking-widest">Earn</p>
                    <p className="font-display text-3xl font-bold text-amber-500 leading-none">
                      {activeDrill.xp}
                    </p>
                    <p className="font-body text-xs text-zinc-400">XP ⭐</p>
                  </div>
                </div>

                {/* Instruction card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.22 }}
                    className="bg-white rounded-3xl p-6 shadow-md border border-zinc-100 min-h-32.5 flex flex-col justify-center"
                  >
                    <p className="font-display text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3">
                      Step {stepIndex + 1}
                    </p>
                    <p className="font-body text-xl leading-relaxed text-zinc-800">
                      {activeDrill.steps[stepIndex]}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Smaller image */}
                <div className="relative h-28 rounded-2xl overflow-hidden bg-zinc-50">
                  <Image src={imgSrc} alt={activeDrill.name} fill className="object-contain p-3" />
                </div>

                {/* Next / Done button */}
                <motion.button
                  key={String(isLast)}
                  whileTap={{ scale: 0.96 }}
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={handleNextStep}
                  className={cn(
                    'w-full py-5 rounded-2xl font-display text-xl font-bold shadow-lg flex items-center justify-center gap-3',
                    isLast
                      ? 'bg-linear-to-r from-emerald-400 to-green-500 text-white shadow-emerald-200'
                      : 'bg-linear-to-r from-amber-400 to-orange-400 text-white shadow-amber-200'
                  )}
                >
                  {isLast ? (
                    <>I&apos;m Done! ✓</>
                  ) : (
                    <>Next Step <ChevronRight size={22} /></>
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* ── COMPLETE ── */}
            {phase === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="space-y-6 text-center"
              >
                {/* Big celebration star */}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: [0, 1.35, 1], rotate: [- 30, 10, 0] }}
                  transition={{ duration: 0.55, times: [0, 0.65, 1] }}
                  className="text-8xl"
                >
                  🌟
                </motion.div>

                <div>
                  <h2 className="font-display text-3xl font-bold text-zinc-900">Amazing job! ⭐</h2>
                  <p className="font-body text-base text-zinc-500 mt-1">{activeDrill.name} complete!</p>
                </div>

                {/* XP earned */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-3xl p-6 border border-amber-200"
                >
                  <p className="font-body text-sm text-amber-600 mb-1">You earned</p>
                  <p className="font-display text-5xl font-bold text-amber-500">+{activeDrill.xp} XP</p>
                  <div className="flex items-center justify-center gap-1 mt-3">
                    {Array.from({ length: Math.min(5, Math.ceil(activeDrill.xp / 50)) }, (_, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 300 }}
                        className="text-2xl"
                      >
                        ⭐
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="font-body text-sm text-zinc-400"
                >
                  Total XP:{' '}
                  <span className="font-semibold text-zinc-700">{totalXP + activeDrill.xp}</span>
                </motion.p>

                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleCollectStars}
                  className="w-full py-5 rounded-2xl bg-linear-to-r from-violet-500 to-purple-600 text-white font-display text-xl font-bold shadow-lg shadow-violet-200 flex items-center justify-center gap-3"
                >
                  <Star size={22} fill="white" />
                  Collect Stars! 🎉
                </motion.button>

                <button
                  onClick={() => { setPhase('intro'); setStepIndex(0); setElapsed(0); }}
                  className="flex items-center gap-1.5 mx-auto font-body text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <RotateCcw size={13} /> Do it again
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────
  // BROWSE VIEW
  // ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/dashboard/dream-gym"
          className="inline-flex items-center gap-1.5 font-body text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
        >
          <ChevronLeft size={15} /> Dream Gym
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Footprints className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-zinc-900">Practice Drills</h2>
              <p className="font-body text-sm text-zinc-500">Soccer skill training — let&apos;s level up! 🎮</p>
            </div>
          </div>

          {/* XP badge + sound toggle */}
          <div className="flex items-center gap-2">
            <motion.div
              key={totalXP}
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100"
            >
              <Zap size={14} className="text-amber-500" />
              <span className="font-display text-sm font-bold text-amber-600">{totalXP} XP</span>
            </motion.div>
            <button
              onClick={() => setSound((s) => !s)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label="Toggle sound"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Athlete selector for logging */}
      {players.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="font-body text-xs text-zinc-400">Logging for:</span>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className={cn(
                'px-3 py-1 rounded-full font-body text-xs font-medium transition-colors',
                selectedPlayerId === p.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-500 hover:bg-zinc-100 border border-zinc-200'
              )}
            >
              {p.name}
            </button>
          ))}
          {!selectedPlayerId && (
            <span className="font-body text-xs text-amber-600">← pick an athlete to save drills</span>
          )}
        </motion.div>
      )}

      {/* Focus area tabs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      >
        {focusAreas.map((area) => (
          <button
            key={area.label}
            onClick={() => setActiveFocus(area.label)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full font-display text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5',
              activeFocus === area.label
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 shadow-sm'
            )}
          >
            <span>{area.emoji}</span>
            {area.label}
          </button>
        ))}
      </motion.div>

      {/* Focus greeting + completion badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFocus}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-between"
        >
          <p className="font-display text-lg font-semibold text-zinc-900">
            {focusMeta.emoji} {focusMeta.greeting}
          </p>
          {doneCount > 0 && (
            <span className="font-body text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              {doneCount}/{drills.length} done ✓
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Drill grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFocus}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {drills.map((drill, i) => {
            const imgSrc = getPracticeAnimation(drill.focusArea);
            const done   = completedDrills.has(drill.id);
            const ic     = intensityStyles[drill.intensity];
            return (
              <motion.div
                key={drill.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -5, boxShadow: '0 14px 30px rgba(0,0,0,0.09)' }}
                className={cn(
                  'bg-white rounded-3xl overflow-hidden shadow-sm',
                  done && 'ring-2 ring-emerald-400 ring-offset-1'
                )}
              >
                {/* Image area */}
                <div className="relative aspect-4/3 overflow-hidden bg-zinc-50">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={imgSrc} alt={drill.name} fill
                      className="object-contain p-6"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </motion.div>

                  {/* Emoji badge */}
                  <div className="absolute top-3 left-3 w-9 h-9 bg-white rounded-full shadow-sm flex items-center justify-center text-lg">
                    {drill.emoji}
                  </div>

                  {/* Completion check */}
                  {done && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-display text-base font-bold text-zinc-900">{drill.name}</h4>
                    <p className="font-body text-xs text-zinc-500 mt-0.5 line-clamp-2">{drill.description}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('font-body text-xs font-semibold px-2 py-0.5 rounded-full', ic.bg, ic.text)}>
                      {drill.intensity}
                    </span>
                    <span className="font-body text-xs text-zinc-400">{drill.duration}</span>
                    <span className="font-display text-xs font-bold text-amber-500 ml-auto">⭐ {drill.xp} XP</span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => startDrill(drill, i)}
                    className={cn(
                      'w-full py-4 rounded-2xl font-display text-base font-bold transition-all flex items-center justify-center gap-2',
                      done
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-linear-to-r from-amber-400 to-orange-400 text-white shadow-md shadow-amber-100 hover:shadow-lg hover:shadow-amber-200'
                    )}
                  >
                    {done ? (
                      <><RotateCcw size={15} /> Play Again</>
                    ) : (
                      <><Play size={15} fill="white" /> Start Drill</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
