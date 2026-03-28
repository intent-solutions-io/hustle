'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Brain,
  Target,
  BarChart3,
  Scale,
  ClipboardCheck,
  Timer,
  CalendarDays,
  Footprints,
  Flame,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { ProgressRing } from '@/components/ui/progress-ring';
import { staggerContainer, staggerItem } from '@/lib/animation';

const modules = [
  {
    name: 'Schedule',
    href: '/dashboard/dream-gym/schedule',
    icon: CalendarDays,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-600',
    desc: 'Weekly training calendar',
  },
  {
    name: 'Workout',
    href: '/dashboard/dream-gym/workout',
    icon: Dumbbell,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50 text-orange-600',
    desc: 'Strength & conditioning',
  },
  {
    name: 'Cardio',
    href: '/dashboard/dream-gym/cardio',
    icon: Timer,
    color: 'bg-red-500',
    lightColor: 'bg-red-50 text-red-600',
    desc: 'Endurance training',
  },
  {
    name: 'Mental',
    href: '/dashboard/dream-gym/mental',
    icon: Brain,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50 text-purple-600',
    desc: 'Focus & visualization',
  },
  {
    name: 'Strategy',
    href: '/dashboard/dream-gym/strategy',
    icon: Target,
    color: 'bg-green-500',
    lightColor: 'bg-green-50 text-green-600',
    desc: 'Game tactics & plays',
  },
  {
    name: 'Progress',
    href: '/dashboard/dream-gym/progress',
    icon: BarChart3,
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-50 text-cyan-600',
    desc: 'Track improvements',
  },
  {
    name: 'Biometrics',
    href: '/dashboard/dream-gym/biometrics',
    icon: Scale,
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50 text-pink-600',
    desc: 'Height, weight, fitness',
  },
  {
    name: 'Assessments',
    href: '/dashboard/dream-gym/assessments',
    icon: ClipboardCheck,
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50 text-indigo-600',
    desc: 'Skills evaluation',
  },
  {
    name: 'Practices',
    href: '/dashboard/dream-gym/practices',
    icon: Footprints,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-600',
    desc: 'Soccer drill library',
  },
];

export default function DreamGymPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-zinc-900 rounded-2xl p-6 text-white overflow-hidden relative"
      >
        {/* Decorative bg */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute right-8 top-4 w-24 h-24 bg-amber-500/10 rounded-full" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-lg font-semibold">
                Dream Gym
              </span>
            </div>
            <h2 className="font-display text-3xl font-semibold mb-1">
              AI-Powered Training
            </h2>
            <p className="font-body text-zinc-400 text-sm max-w-sm">
              Personalized workouts, mental conditioning, and soccer-specific
              drills — all in one place.
            </p>
          </div>
          <div className="hidden md:block shrink-0">
            <ProgressRing
              progress={0}
              size={90}
              strokeWidth={8}
              label="This week"
              color="amber"
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        <Link href="/dashboard/dream-gym/workout">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-zinc-900">
                Start Workout
              </p>
              <p className="font-body text-xs text-zinc-500">
                Strength · 45 min
              </p>
            </div>
            <ChevronRight
              size={16}
              className="text-zinc-300 group-hover:text-amber-500 transition-colors"
            />
          </motion.div>
        </Link>

        <Link href="/dashboard/dream-gym/practices">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Footprints className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-zinc-900">
                Practice Drills
              </p>
              <p className="font-body text-xs text-zinc-500">
                Soccer · 9 drills
              </p>
            </div>
            <ChevronRight
              size={16}
              className="text-zinc-300 group-hover:text-amber-500 transition-colors"
            />
          </motion.div>
        </Link>
      </motion.div>

      {/* Module Grid */}
      <div>
        <h3 className="font-display text-base font-semibold text-zinc-700 mb-3 px-1">
          All Modules
        </h3>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {modules.map((mod) => (
            <motion.div key={mod.name} variants={staggerItem}>
              <Link href={mod.href}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer h-full"
                >
                  <div
                    className={`w-11 h-11 ${mod.color} rounded-xl flex items-center justify-center mb-3`}
                  >
                    <mod.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-display text-sm font-semibold text-zinc-900 mb-0.5">
                    {mod.name}
                  </h4>
                  <p className="font-body text-xs text-zinc-500">{mod.desc}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
