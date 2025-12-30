/**
 * Journal Entry Validation Schema
 *
 * Zod schemas for validating journal entries with mood/energy tracking.
 */

import { z } from 'zod';

/**
 * Journal Entry Context Options
 */
export const journalContexts = [
  'workout_reflection',
  'mental_checkin',
  'game_reflection',
  'daily_journal',
  'quick_entry',
] as const;

/**
 * Journal Mood Tags
 */
export const journalMoodTags = ['great', 'good', 'okay', 'struggling', 'rough'] as const;

/**
 * Journal Energy Tags
 */
export const journalEnergyTags = ['energized', 'normal', 'tired', 'exhausted'] as const;

/**
 * Journal Entry Create Schema
 *
 * For creating a new journal entry.
 */
export const journalEntryCreateSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  date: z.string().min(1, 'Date is required'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  context: z.enum(journalContexts, { message: 'Invalid journal context' }),
  moodTag: z.enum(journalMoodTags).nullable().optional(),
  energyTag: z.enum(journalEnergyTags).nullable().optional(),
  linkedWorkoutId: z.string().nullable().optional(),
  linkedGameId: z.string().nullable().optional(),
});

/**
 * Journal Entry Update Schema
 *
 * For updating an existing journal entry (partial updates allowed).
 */
export const journalEntryUpdateSchema = journalEntryCreateSchema
  .partial()
  .omit({ playerId: true });

/**
 * Journal Entry Query Schema
 *
 * For filtering/pagination when listing journal entries.
 */
export const journalEntryQuerySchema = z.object({
  context: z.enum(journalContexts).optional(),
  moodTag: z.enum(journalMoodTags).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

/**
 * Quick Journal Entry Schema
 *
 * Simplified schema for quick journal entries from widgets.
 */
export const quickJournalEntrySchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(500, 'Quick entries must be less than 500 characters'),
  moodTag: z.enum(journalMoodTags).optional(),
});

/**
 * Mood Tag Display Config
 */
export const MOOD_TAG_CONFIG = {
  great: { label: 'Great', emoji: '😊', color: 'bg-green-100 text-green-800' },
  good: { label: 'Good', emoji: '🙂', color: 'bg-blue-100 text-blue-800' },
  okay: { label: 'Okay', emoji: '😐', color: 'bg-yellow-100 text-yellow-800' },
  struggling: { label: 'Struggling', emoji: '😔', color: 'bg-orange-100 text-orange-800' },
  rough: { label: 'Rough', emoji: '😣', color: 'bg-red-100 text-red-800' },
} as const;

/**
 * Energy Tag Display Config
 */
export const ENERGY_TAG_CONFIG = {
  energized: { label: 'Energized', emoji: '⚡', color: 'bg-yellow-100 text-yellow-800' },
  normal: { label: 'Normal', emoji: '😊', color: 'bg-blue-100 text-blue-800' },
  tired: { label: 'Tired', emoji: '😴', color: 'bg-gray-100 text-gray-800' },
  exhausted: { label: 'Exhausted', emoji: '😩', color: 'bg-red-100 text-red-800' },
} as const;

/**
 * Context Display Config
 */
export const CONTEXT_CONFIG = {
  workout_reflection: { label: 'Workout Reflection', emoji: '💪', color: 'bg-purple-100 text-purple-800' },
  mental_checkin: { label: 'Mental Check-in', emoji: '🧠', color: 'bg-blue-100 text-blue-800' },
  game_reflection: { label: 'Game Reflection', emoji: '⚽', color: 'bg-green-100 text-green-800' },
  daily_journal: { label: 'Daily Journal', emoji: '📔', color: 'bg-amber-100 text-amber-800' },
  quick_entry: { label: 'Quick Entry', emoji: '✍️', color: 'bg-gray-100 text-gray-800' },
} as const;

/**
 * Inferred TypeScript types
 */
export type JournalContext = (typeof journalContexts)[number];
export type JournalMoodTag = (typeof journalMoodTags)[number];
export type JournalEnergyTag = (typeof journalEnergyTags)[number];
export type JournalEntryCreateInput = z.infer<typeof journalEntryCreateSchema>;
export type JournalEntryUpdateInput = z.infer<typeof journalEntryUpdateSchema>;
export type JournalEntryQueryInput = z.infer<typeof journalEntryQuerySchema>;
export type QuickJournalEntryInput = z.infer<typeof quickJournalEntrySchema>;
