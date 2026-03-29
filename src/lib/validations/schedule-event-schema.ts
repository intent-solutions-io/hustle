/**
 * Schedule Event Validation Schema
 *
 * Zod schemas for validating season schedule event data.
 */

import { z } from 'zod';

export const scheduleEventTypes = [
  'game',
  'practice',
  'tournament',
  'tryout',
  'camp',
  'training',
  'other',
] as const;

export const scheduleEventCreateSchema = z.object({
  playerIds: z.array(z.string().min(1)).default([]),
  type: z.enum(scheduleEventTypes, { message: 'Invalid event type' }),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  date: z.string().min(1, 'Date is required'),
  endDate: z.string().nullable().optional(),
  location: z
    .string()
    .max(150, 'Location too long')
    .nullable()
    .optional(),
  opponent: z
    .string()
    .max(100, 'Opponent name too long')
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes must be under 500 characters')
    .nullable()
    .optional(),
});

export const scheduleEventUpdateSchema = scheduleEventCreateSchema.partial();

export const scheduleEventQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  playerId: z.string().optional(),
  type: z.enum(scheduleEventTypes).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export type ScheduleEventCreateInput = z.infer<typeof scheduleEventCreateSchema>;
export type ScheduleEventUpdateInput = z.infer<typeof scheduleEventUpdateSchema>;
export type ScheduleEventQueryInput = z.infer<typeof scheduleEventQuerySchema>;

export function getScheduleEventTypeLabel(type: typeof scheduleEventTypes[number]): string {
  const labels: Record<typeof scheduleEventTypes[number], string> = {
    game: 'Game',
    practice: 'Practice',
    tournament: 'Tournament',
    tryout: 'Tryout',
    camp: 'Camp / Clinic',
    training: 'Training',
    other: 'Other',
  };
  return labels[type];
}
