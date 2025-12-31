/**
 * Biometrics Validation Schema
 *
 * Zod schemas for validating biometrics/health data including heart rate, sleep, and activity.
 */

import { z } from 'zod';

/**
 * Biometrics Data Sources
 */
export const biometricsSources = [
  'manual',
  'apple_health',
  'garmin',
  'fitbit',
  'google_fit',
] as const;

/**
 * Heart Rate Zone Schema
 */
export const heartRateZoneSchema = z.object({
  zone: z.number().int().min(1).max(5),
  minutes: z.number().min(0, 'Minutes cannot be negative'),
});

/**
 * Biometrics Log Create Schema
 *
 * For creating a new biometrics log entry.
 */
export const biometricsLogCreateSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  date: z.string().min(1, 'Date is required'),

  // Heart rate metrics
  restingHeartRate: z.number().int().min(30).max(220).nullable().optional(),
  maxHeartRate: z.number().int().min(30).max(220).nullable().optional(),
  avgHeartRate: z.number().int().min(30).max(220).nullable().optional(),
  hrv: z.number().min(0).max(300).nullable().optional(), // HRV in ms

  // Sleep metrics
  sleepScore: z.number().int().min(0).max(100).nullable().optional(),
  sleepHours: z.number().min(0).max(24).nullable().optional(),

  // Activity metrics
  steps: z.number().int().min(0).max(100000).nullable().optional(),
  activeMinutes: z.number().int().min(0).max(1440).nullable().optional(), // Max 24 hours

  // Data source
  source: z.enum(biometricsSources, { message: 'Invalid biometrics source' }),
});

/**
 * Biometrics Log Update Schema
 *
 * For updating an existing biometrics log (partial updates allowed).
 */
export const biometricsLogUpdateSchema = biometricsLogCreateSchema.partial().omit({ playerId: true });

/**
 * Biometrics Log Query Schema
 *
 * For filtering/pagination when listing biometrics logs.
 */
export const biometricsLogQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  source: z.enum(biometricsSources).optional(),
  limit: z.number().int().min(1).max(100).default(30),
  cursor: z.string().optional(),
});

/**
 * Calculate recovery score based on biometrics
 *
 * Simple recovery score calculation:
 * - Higher HRV = better recovery
 * - Higher sleep score = better recovery
 * - Lower resting heart rate = better recovery
 */
export function calculateRecoveryScore(biometrics: {
  restingHeartRate?: number | null;
  hrv?: number | null;
  sleepScore?: number | null;
}): number | null {
  const scores: number[] = [];

  // HRV contribution (0-40 points)
  if (biometrics.hrv != null) {
    // Typical youth athlete HRV: 40-120ms
    const hrvScore = Math.min(40, Math.max(0, ((biometrics.hrv - 40) / 80) * 40));
    scores.push(hrvScore);
  }

  // Sleep score contribution (0-40 points)
  if (biometrics.sleepScore != null) {
    const sleepContribution = (biometrics.sleepScore / 100) * 40;
    scores.push(sleepContribution);
  }

  // Resting heart rate contribution (0-20 points)
  if (biometrics.restingHeartRate != null) {
    // Lower is better - typical youth range 50-80 bpm
    const rhrScore = Math.max(0, 20 - ((biometrics.restingHeartRate - 50) / 30) * 20);
    scores.push(Math.min(20, Math.max(0, rhrScore)));
  }

  if (scores.length === 0) return null;

  // Average the available scores and scale to 0-100
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const scaleFactor = 100 / (scores.length === 3 ? 100 : scores.length === 2 ? 80 : 40);
  return Math.round(avgScore * scaleFactor);
}

/**
 * Inferred TypeScript types
 */
export type HeartRateZoneInput = z.infer<typeof heartRateZoneSchema>;
export type BiometricsLogCreateInput = z.infer<typeof biometricsLogCreateSchema>;
export type BiometricsLogUpdateInput = z.infer<typeof biometricsLogUpdateSchema>;
export type BiometricsLogQueryInput = z.infer<typeof biometricsLogQuerySchema>;
