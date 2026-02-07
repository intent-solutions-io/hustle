/**
 * Practice Log Validation Schema
 *
 * Zod schemas for validating practice session data.
 */

import { z } from 'zod';

/**
 * Practice Types
 */
export const practiceTypes = [
  'team_practice',
  'small_group',
  'individual',
  'private_lesson',
  'camp',
  'clinic',
] as const;

/**
 * Practice Focus Areas
 */
export const practiceFocusAreas = [
  'passing',
  'shooting',
  'dribbling',
  'defending',
  'heading',
  'first_touch',
  'positioning',
  'set_pieces',
  'goalkeeping',
  'fitness',
  'scrimmage',
  'tactics',
  'other',
] as const;

/**
 * Practice Log Create Schema
 *
 * For creating a new practice log entry.
 */
export const practiceLogCreateSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  date: z.string().min(1, 'Date is required'),
  practiceType: z.enum(practiceTypes, { message: 'Invalid practice type' }),
  durationMinutes: z
    .number()
    .int()
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration cannot exceed 8 hours'),
  focusAreas: z
    .array(z.enum(practiceFocusAreas))
    .min(1, 'Select at least one focus area')
    .max(5, 'Select up to 5 focus areas'),
  teamName: z.string().max(100, 'Team name must be less than 100 characters').nullable().optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').nullable().optional(),
  drillsCompleted: z
    .array(z.string().max(100, 'Drill name too long'))
    .max(20, 'Too many drills')
    .nullable()
    .optional(),
  intensity: z.number().int().min(1).max(5).nullable().optional(),
  enjoyment: z.number().int().min(1).max(5).nullable().optional(),
  improvement: z.string().max(500, 'Improvement notes must be less than 500 characters').nullable().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').nullable().optional(),
});

/**
 * Practice Log Update Schema
 *
 * For updating an existing practice log (partial updates allowed).
 */
export const practiceLogUpdateSchema = practiceLogCreateSchema.partial().omit({ playerId: true });

/**
 * Practice Log Query Schema
 *
 * For filtering/pagination when listing practice logs.
 */
export const practiceLogQuerySchema = z.object({
  practiceType: z.enum(practiceTypes).optional(),
  focusArea: z.enum(practiceFocusAreas).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

/**
 * Get display name for practice type
 */
export function getPracticeTypeLabel(type: typeof practiceTypes[number]): string {
  const labels: Record<typeof practiceTypes[number], string> = {
    team_practice: 'Team Practice',
    small_group: 'Small Group Training',
    individual: 'Individual Practice',
    private_lesson: 'Private Lesson',
    camp: 'Soccer Camp',
    clinic: 'Skills Clinic',
  };
  return labels[type];
}

/**
 * Get display name for focus area
 */
export function getFocusAreaLabel(area: typeof practiceFocusAreas[number]): string {
  const labels: Record<typeof practiceFocusAreas[number], string> = {
    passing: 'Passing',
    shooting: 'Shooting',
    dribbling: 'Dribbling',
    defending: 'Defending',
    heading: 'Heading',
    first_touch: 'First Touch',
    positioning: 'Positioning',
    set_pieces: 'Set Pieces',
    goalkeeping: 'Goalkeeping',
    fitness: 'Fitness',
    scrimmage: 'Scrimmage',
    tactics: 'Tactics',
    other: 'Other',
  };
  return labels[area];
}

/**
 * Inferred TypeScript types
 */
export type PracticeLogCreateInput = z.infer<typeof practiceLogCreateSchema>;
export type PracticeLogUpdateInput = z.infer<typeof practiceLogUpdateSchema>;
export type PracticeLogQueryInput = z.infer<typeof practiceLogQuerySchema>;
