import { z } from 'zod';

export const mealTypes = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout',
] as const;

export const mealLogCreateSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  date: z.string().min(1, 'Date is required'),
  mealType: z.enum(mealTypes, { message: 'Invalid meal type' }),
  description: z.string().min(1, 'Description is required').max(200),
  calories: z.number().int().min(0).max(9999).nullable().optional(),
  protein: z.number().min(0).max(500).nullable().optional(),
  carbs: z.number().min(0).max(500).nullable().optional(),
  fat: z.number().min(0).max(500).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const mealLogUpdateSchema = mealLogCreateSchema.partial().omit({ playerId: true });

export const mealLogQuerySchema = z.object({
  mealType: z.enum(mealTypes).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type MealLogCreateInput = z.infer<typeof mealLogCreateSchema>;
export type MealLogUpdateInput = z.infer<typeof mealLogUpdateSchema>;
export type MealLogQueryInput = z.infer<typeof mealLogQuerySchema>;
