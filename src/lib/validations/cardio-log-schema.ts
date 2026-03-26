/**
 * Cardio Log Validation Schema
 *
 * Zod schemas for validating cardio/running log data.
 */

import { z } from 'zod';

/**
 * Cardio Activity Types
 */
export const cardioActivityTypes = [
  'run',
  'jog',
  'sprint',
  'interval',
  'recovery',
  'long_run',
] as const;

/**
 * Perceived Effort Levels (1-5 RPE scale)
 */
export const perceivedEffortLevels = [1, 2, 3, 4, 5] as const;

/**
 * Cardio Log Create Schema
 *
 * For creating a new cardio log entry.
 */
export const cardioLogCreateSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  date: z.string().min(1, 'Date is required'),
  activityType: z.enum(cardioActivityTypes, { message: 'Invalid activity type' }),
  distanceMiles: z
    .number()
    .min(0.01, 'Distance must be at least 0.01 miles')
    .max(100, 'Distance cannot exceed 100 miles'),
  durationMinutes: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(600, 'Duration cannot exceed 10 hours'),
  avgPacePerMile: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/, 'Pace must be in mm:ss format')
    .nullable()
    .optional(),
  calories: z.number().int().min(0).max(5000).nullable().optional(),
  avgHeartRate: z.number().int().min(40).max(220).nullable().optional(),
  maxHeartRate: z.number().int().min(40).max(250).nullable().optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').nullable().optional(),
  weather: z.string().max(50, 'Weather must be less than 50 characters').nullable().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').nullable().optional(),
  perceivedEffort: z.enum(['1', '2', '3', '4', '5']).transform(Number).nullable().optional(),
});

/**
 * Cardio Log Update Schema
 *
 * For updating an existing cardio log (partial updates allowed).
 */
export const cardioLogUpdateSchema = cardioLogCreateSchema.partial().omit({ playerId: true });

/**
 * Cardio Log Query Schema
 *
 * For filtering/pagination when listing cardio logs.
 */
export const cardioLogQuerySchema = z.object({
  activityType: z.enum(cardioActivityTypes).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

/**
 * Calculate pace from distance and duration
 * Returns pace in mm:ss format
 */
export function calculatePace(distanceMiles: number, durationMinutes: number): string {
  if (distanceMiles <= 0) return '0:00';
  const paceMinutes = durationMinutes / distanceMiles;
  const mins = Math.floor(paceMinutes);
  const secs = Math.round((paceMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Inferred TypeScript types
 */
export type CardioLogCreateInput = z.infer<typeof cardioLogCreateSchema>;
export type CardioLogUpdateInput = z.infer<typeof cardioLogUpdateSchema>;
export type CardioLogQueryInput = z.infer<typeof cardioLogQuerySchema>;
