/**
 * Player Validation Schema
 *
 * Zod schemas for validating player profile data including positions, gender, and league information.
 */

import { z } from 'zod';

/**
 * Soccer Position Codes
 */
export const soccerPositionCodes = [
  'GK',
  'CB',
  'RB',
  'LB',
  'RWB',
  'LWB',
  'DM',
  'CM',
  'AM',
  'RW',
  'LW',
  'ST',
  'CF',
] as const;

/**
 * League Codes
 */
export const leagueCodes = [
  // A. National Elite Leagues
  'ecnl_girls',
  'ecnl_boys',
  'ecnl_rl_girls',
  'ecnl_rl_boys',
  'mls_next',
  'girls_academy',
  'dpl',
  'elite_academy',
  'national_academy_league',

  // B. National Club / Franchise Organizations
  'rush_soccer',
  'surf_soccer',
  'barca_residency',
  'tfa_national',
  'strikers_fc',
  'sporting_kc_youth',
  'fc_dallas_youth',
  'real_colorado',
  'celtic_fc_usa',
  'pda_soccer',
  'legends_fc',
  'la_galaxy_academy',

  // C. USYS / US Club Leagues
  'usys_national_pro',
  'usys_nlc',
  'elite_64',
  'npl',
  'edp',
  'norcal',
  'socal',
  'nycsl',
  'mid_america_academy',

  // D. Regional / State
  'state_premier',
  'state_championship',
  'state_classic',
  'regional_premier',
  'regional_select',

  // E. School-Based
  'high_school',
  'middle_school',

  // F. Local / Rec
  'local_travel',
  'local_rec',
  'ymca',

  // G. Catch-All
  'other',
] as const;

/**
 * Player Schema
 *
 * Validates player profile data including:
 * - Basic info (name, birthday, photo)
 * - Gender (required)
 * - Structured positions (primary + optional secondary)
 * - League information with "other" validation
 * - Team/club info
 */
export const playerSchema = z
  .object({
    // Basic Info
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),

    birthday: z
      .string()
      .min(1, 'Birthday is required')
      .refine((dateStr) => {
        const birthDate = new Date(dateStr);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 5 && age <= 25;
      }, { message: 'Player must be between 5 and 25 years old' }),

    // Gender
    gender: z.enum(['male', 'female'], {
      errorMap: () => ({ message: 'Please select a gender' }),
    }),

    // Structured Positions
    primaryPosition: z.enum(soccerPositionCodes, {
      errorMap: () => ({ message: 'Please select a primary position' }),
    }),

    secondaryPositions: z
      .array(z.enum(soccerPositionCodes))
      .max(3, 'You can select up to 3 secondary positions')
      .optional(),

    positionNote: z
      .string()
      .max(100, 'Position note must be less than 100 characters')
      .optional(),

    // League Information
    leagueCode: z.enum(leagueCodes, {
      errorMap: () => ({ message: 'Please select a league' }),
    }),

    leagueOtherName: z
      .string()
      .max(100, 'League name must be less than 100 characters')
      .optional(),

    // Team/Club Info
    teamClub: z
      .string()
      .min(1, 'Team/Club is required')
      .min(2, 'Team/Club must be at least 2 characters')
      .max(100, 'Team/Club must be less than 100 characters'),

    // Photo URL (optional, validated separately during upload)
    photoUrl: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // Validation: When "other" league is selected, custom name is required
    if (data.leagueCode === 'other' && !data.leagueOtherName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['leagueOtherName'],
        message: 'Please enter the league name when you select Other',
      });
    }

    // Validation: Secondary positions should not include primary position
    if (data.secondaryPositions?.includes(data.primaryPosition)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['secondaryPositions'],
        message: 'Secondary positions cannot include the primary position',
      });
    }
  });

/**
 * Inferred TypeScript type from schema
 */
export type PlayerFormData = z.infer<typeof playerSchema>;
