/**
 * Workout Log Validation Schema
 *
 * Zod schemas for validating workout log data including sets, reps, weight tracking.
 */

import { z } from 'zod';

/**
 * Workout Log Types
 */
export const workoutLogTypes = [
  'strength',
  'conditioning',
  'core',
  'recovery',
  'custom',
  'soccer_specific',
] as const;

/**
 * Individual Set Log Schema
 */
export const workoutSetLogSchema = z.object({
  setNumber: z.number().int().min(1, 'Set number must be at least 1'),
  reps: z.number().int().min(0, 'Reps cannot be negative'),
  weight: z.number().min(0, 'Weight cannot be negative').nullable().optional(),
  completed: z.boolean(),
  notes: z.string().max(200, 'Notes must be less than 200 characters').nullable().optional(),
});

/**
 * Exercise Log Schema (within a workout)
 */
export const workoutExerciseLogSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  exerciseName: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name too long'),
  targetSets: z.number().int().min(1, 'Target sets must be at least 1'),
  targetReps: z.string().min(1, 'Target reps is required').max(20, 'Target reps format too long'),
  sets: z.array(workoutSetLogSchema).min(1, 'At least one set is required'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').nullable().optional(),
});

/**
 * Workout Log Create Schema
 *
 * For creating a new workout log entry.
 */
export const workoutLogCreateSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  workoutId: z.string().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(workoutLogTypes, { message: 'Invalid workout type' }),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  exercises: z.array(workoutExerciseLogSchema).min(1, 'At least one exercise is required'),
  totalVolume: z.number().min(0).nullable().optional(),
  journalEntryId: z.string().nullable().optional(),
});

/**
 * Workout Log Update Schema
 *
 * For updating an existing workout log (partial updates allowed).
 */
export const workoutLogUpdateSchema = workoutLogCreateSchema.partial().omit({ playerId: true });

/**
 * Workout Log Query Schema
 *
 * For filtering/pagination when listing workout logs.
 */
export const workoutLogQuerySchema = z.object({
  type: z.enum(workoutLogTypes).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

/**
 * Calculate total volume from exercises
 */
export function calculateTotalVolume(exercises: z.infer<typeof workoutExerciseLogSchema>[]): number {
  return exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((setTotal, set) => {
      if (set.completed && set.weight) {
        return setTotal + (set.reps * set.weight);
      }
      return setTotal;
    }, 0);
    return total + exerciseVolume;
  }, 0);
}

/**
 * Inferred TypeScript types
 */
export type WorkoutSetLogInput = z.infer<typeof workoutSetLogSchema>;
export type WorkoutExerciseLogInput = z.infer<typeof workoutExerciseLogSchema>;
export type WorkoutLogCreateInput = z.infer<typeof workoutLogCreateSchema>;
export type WorkoutLogUpdateInput = z.infer<typeof workoutLogUpdateSchema>;
export type WorkoutLogQueryInput = z.infer<typeof workoutLogQuerySchema>;
