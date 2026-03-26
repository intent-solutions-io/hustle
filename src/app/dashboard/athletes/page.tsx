'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Users, Search } from 'lucide-react';
import { useState } from 'react';
import { PositionBadge } from '@/components/ui/position-badge';
import { staggerContainer, staggerItem } from '@/lib/animation';
import { mockAthletes } from '@/lib/mock-data';
import { getInitials, getAvatarColor, calculateAge } from '@/lib/player-utils';
import { cn } from '@/lib/utils';

export default function AthletesPage() {
  const [search, setSearch] = useState('');

  const filtered = mockAthletes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.teamName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-2xl font-semibold text-zinc-900">Athletes</h2>
          <p className="font-body text-sm text-zinc-500 mt-0.5">
            {mockAthletes.length} athlete{mockAthletes.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Link href="/dashboard/add-athlete">
          <motion.span
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white font-display font-semibold text-sm px-4 py-2.5 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Plus size={16} />
            Add Athlete
          </motion.span>
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="relative"
      >
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          placeholder="Search athletes or teams…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-zinc-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-zinc-400"
        />
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm text-center"
        >
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <Users size={28} className="text-amber-500" />
          </div>
          <h3 className="font-display text-lg font-semibold text-zinc-900 mb-1">
            {search ? 'No athletes found' : 'No athletes yet'}
          </h3>
          <p className="font-body text-sm text-zinc-500 mb-6 max-w-xs">
            {search
              ? `No athletes match "${search}". Try a different name or team.`
              : 'Add your first athlete to start tracking their soccer performance.'}
          </p>
          {!search && (
            <Link href="/dashboard/add-athlete">
              <span className="inline-flex items-center gap-2 bg-zinc-900 text-white font-display font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-zinc-800 transition-colors">
                <Plus size={15} />
                Add First Athlete
              </span>
            </Link>
          )}
        </motion.div>
      )}

      {/* Athletes grid */}
      {filtered.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((athlete) => (
            <motion.div key={athlete.id} variants={staggerItem}>
              <Link href={`/dashboard/athletes/${athlete.id}`}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.09)' }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer"
                >
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-semibold text-lg shrink-0',
                        getAvatarColor(athlete.name)
                      )}
                    >
                      {getInitials(athlete.name)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-display text-base font-semibold text-zinc-900 truncate">
                        {athlete.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <PositionBadge position={athlete.positionShort} />
                        <span className="font-body text-xs text-zinc-500">
                          Age {calculateAge(athlete.dateOfBirth)}
                        </span>
                      </div>
                    </div>
                    {athlete.jerseyNumber && (
                      <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="font-display text-sm font-semibold text-zinc-600">
                          {athlete.jerseyNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Team */}
                  <p className="font-body text-xs text-zinc-500 mb-4 truncate">
                    {athlete.teamName}
                  </p>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-100">
                    {[
                      { label: 'Games', val: athlete.stats.games },
                      { label: 'Goals', val: athlete.stats.goals },
                      { label: 'Assists', val: athlete.stats.assists },
                    ].map(({ label, val }) => (
                      <div key={label} className="text-center">
                        <p className="font-display text-xl font-semibold text-zinc-900">
                          {val}
                        </p>
                        <p className="font-body text-xs text-zinc-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}

          {/* Add more card */}
          <motion.div variants={staggerItem}>
            <Link href="/dashboard/add-athlete">
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="h-full min-h-[200px] bg-white rounded-2xl shadow-sm border-2 border-dashed border-zinc-200 hover:border-amber-400 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 bg-zinc-100 group-hover:bg-amber-50 rounded-2xl flex items-center justify-center transition-colors">
                  <Plus size={22} className="text-zinc-400 group-hover:text-amber-500 transition-colors" />
                </div>
                <p className="font-display text-sm font-semibold text-zinc-400 group-hover:text-amber-600 transition-colors">
                  Add Athlete
                </p>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
