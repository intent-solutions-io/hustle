import { z } from 'zod';

export const gameSchema = z.object({
  playerId: z.string().min(1, 'Please select an athlete'),
  date: z.string()
    .min(1, 'Game date is required')
    .refine((dateStr) => {
      const gameDate = new Date(dateStr);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return gameDate <= today;
    }, { message: 'Game date cannot be in the future' }),
  opponent: z
    .string()
    .min(3, 'Opponent name must be at least 3 characters')
    .max(100, 'Opponent name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-\.&']+$/, 'Opponent name contains invalid characters'),
  result: z.enum(['Win', 'Loss', 'Draw']),
  yourScore: z.number().int().min(0, 'Score must be 0 or greater').max(20, 'Score must be 20 or less'),
  opponentScore: z.number().int().min(0, 'Score must be 0 or greater').max(20, 'Score must be 20 or less'),
  minutesPlayed: z.number().int().min(0, 'Minutes must be 0 or greater').max(120, 'Minutes must be 120 or less'),
  goals: z.number().int().min(0, 'Goals must be 0 or greater').max(20, 'Goals must be 20 or less'),

  // Offensive stats (Field players)
  assists: z.number().int().min(0, 'Assists must be 0 or greater').max(20, 'Assists must be 20 or less').nullable().optional(),

  // Defensive stats (Defenders)
  tackles: z.number().int().min(0).max(50).nullable().optional(),
  interceptions: z.number().int().min(0).max(30).nullable().optional(),
  clearances: z.number().int().min(0).max(50).nullable().optional(),
  blocks: z.number().int().min(0).max(20).nullable().optional(),
  aerialDuelsWon: z.number().int().min(0).max(30).nullable().optional(),

  // Goalkeeper stats
  saves: z.number().int().min(0, 'Saves must be 0 or greater').max(50, 'Saves must be 50 or less').nullable().optional(),
  goalsAgainst: z.number().int().min(0, 'Goals against must be 0 or greater').max(20, 'Goals against must be 20 or less').nullable().optional(),
  cleanSheet: z.boolean().nullable().optional(),
}).refine((data) => {
  // Validation: Result must match score comparison
  if (data.result === 'Win' && data.yourScore <= data.opponentScore) {
    return false;
  }
  if (data.result === 'Loss' && data.yourScore >= data.opponentScore) {
    return false;
  }
  if (data.result === 'Draw' && data.yourScore !== data.opponentScore) {
    return false;
  }
  return true;
}, {
  message: 'Result does not match the score (Win: your score > opponent, Loss: your score < opponent, Draw: equal scores)',
  path: ['result'],
}).refine((data) => {
  // Validation: Clean sheet requires 0 goals against
  if (data.cleanSheet === true && data.goalsAgainst !== 0) {
    return false;
  }
  return true;
}, {
  message: 'Clean sheet requires 0 goals against',
  path: ['cleanSheet'],
}).refine((data) => {
  // Validation: Player goals cannot exceed team score
  if (data.goals > data.yourScore) {
    return false;
  }
  return true;
}, {
  message: 'Player goals cannot exceed team score',
  path: ['goals'],
});

export type GameFormData = z.infer<typeof gameSchema>;
