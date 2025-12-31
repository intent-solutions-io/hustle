/**
 * Fitness Assessment Validation Schema
 *
 * Zod schemas for validating fitness test data and progress tracking.
 */

import { z } from 'zod';

/**
 * Fitness Test Types
 */
export const fitnessTestTypes = [
  'beep_test',       // Yo-Yo / Beep Test - aerobic endurance
  '40_yard_dash',    // Sprint speed
  'pro_agility',     // 5-10-5 agility test
  'vertical_jump',   // Explosive power
  'plank_hold',      // Core endurance
  'pushups_1min',    // Upper body endurance
  'situps_1min',     // Core endurance
  'mile_run',        // Cardio endurance
] as const;

/**
 * Fitness Test Units
 */
export const fitnessTestUnits = [
  'level',    // Beep test levels
  'seconds',  // Time-based (40yd, agility, plank)
  'inches',   // Vertical jump
  'count',    // Reps (pushups, situps)
  'time',     // mm:ss format (mile run)
] as const;

/**
 * Fitness Test Metadata
 * Static information about each test type
 */
export const fitnessTestMetadata: Record<typeof fitnessTestTypes[number], {
  name: string;
  description: string;
  unit: typeof fitnessTestUnits[number];
  direction: 'higher_better' | 'lower_better';
  minValue: number;
  maxValue: number;
}> = {
  beep_test: {
    name: 'Beep Test (Yo-Yo)',
    description: 'Aerobic endurance - run between cones at increasing speeds',
    unit: 'level',
    direction: 'higher_better',
    minValue: 1,
    maxValue: 21,
  },
  '40_yard_dash': {
    name: '40-Yard Dash',
    description: 'Sprint speed over 40 yards',
    unit: 'seconds',
    direction: 'lower_better',
    minValue: 4.0,
    maxValue: 10.0,
  },
  pro_agility: {
    name: 'Pro Agility (5-10-5)',
    description: 'Agility and change of direction speed',
    unit: 'seconds',
    direction: 'lower_better',
    minValue: 3.5,
    maxValue: 8.0,
  },
  vertical_jump: {
    name: 'Vertical Jump',
    description: 'Explosive leg power',
    unit: 'inches',
    direction: 'higher_better',
    minValue: 6,
    maxValue: 40,
  },
  plank_hold: {
    name: 'Plank Hold',
    description: 'Core endurance - hold plank position',
    unit: 'seconds',
    direction: 'higher_better',
    minValue: 10,
    maxValue: 600, // 10 minutes max
  },
  pushups_1min: {
    name: 'Push-ups (1 min)',
    description: 'Upper body endurance - max push-ups in 1 minute',
    unit: 'count',
    direction: 'higher_better',
    minValue: 0,
    maxValue: 150,
  },
  situps_1min: {
    name: 'Sit-ups (1 min)',
    description: 'Core endurance - max sit-ups in 1 minute',
    unit: 'count',
    direction: 'higher_better',
    minValue: 0,
    maxValue: 150,
  },
  mile_run: {
    name: 'Mile Run',
    description: 'Cardio endurance - 1 mile time',
    unit: 'time',
    direction: 'lower_better',
    minValue: 240,  // 4:00 in seconds
    maxValue: 1200, // 20:00 in seconds
  },
};

/**
 * Fitness Assessment Create Schema
 */
export const fitnessAssessmentCreateSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  date: z.string().min(1, 'Date is required'),
  testType: z.enum(fitnessTestTypes, { message: 'Invalid test type' }),
  value: z.number().min(0, 'Value cannot be negative'),
  unit: z.enum(fitnessTestUnits, { message: 'Invalid unit' }),
  percentile: z.number().int().min(0).max(100).nullable().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').nullable().optional(),
});

/**
 * Fitness Assessment Update Schema
 */
export const fitnessAssessmentUpdateSchema = fitnessAssessmentCreateSchema.partial().omit({ playerId: true });

/**
 * Fitness Assessment Query Schema
 */
export const fitnessAssessmentQuerySchema = z.object({
  testType: z.enum(fitnessTestTypes).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

/**
 * Validate assessment value against test type constraints
 */
export function validateAssessmentValue(
  testType: typeof fitnessTestTypes[number],
  value: number
): { valid: boolean; message?: string } {
  const metadata = fitnessTestMetadata[testType];

  if (value < metadata.minValue) {
    return {
      valid: false,
      message: `${metadata.name} value must be at least ${metadata.minValue} ${metadata.unit}`,
    };
  }

  if (value > metadata.maxValue) {
    return {
      valid: false,
      message: `${metadata.name} value cannot exceed ${metadata.maxValue} ${metadata.unit}`,
    };
  }

  return { valid: true };
}

/**
 * Calculate improvement between two assessments
 */
export function calculateImprovement(
  testType: typeof fitnessTestTypes[number],
  oldValue: number,
  newValue: number
): { improved: boolean; percentage: number } {
  const metadata = fitnessTestMetadata[testType];
  const diff = newValue - oldValue;

  if (metadata.direction === 'higher_better') {
    return {
      improved: diff > 0,
      percentage: oldValue > 0 ? Math.round((diff / oldValue) * 100) : 0,
    };
  } else {
    // Lower is better (times)
    return {
      improved: diff < 0,
      percentage: oldValue > 0 ? Math.round((-diff / oldValue) * 100) : 0,
    };
  }
}

/**
 * Convert time string (mm:ss) to seconds
 */
export function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const minutes = parseInt(parts[0], 10) || 0;
  const seconds = parseInt(parts[1], 10) || 0;
  return minutes * 60 + seconds;
}

/**
 * Convert seconds to time string (mm:ss)
 */
export function secondsToTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Inferred TypeScript types
 */
export type FitnessTestType = typeof fitnessTestTypes[number];
export type FitnessTestUnit = typeof fitnessTestUnits[number];
export type FitnessAssessmentCreateInput = z.infer<typeof fitnessAssessmentCreateSchema>;
export type FitnessAssessmentUpdateInput = z.infer<typeof fitnessAssessmentUpdateSchema>;
export type FitnessAssessmentQueryInput = z.infer<typeof fitnessAssessmentQuerySchema>;
