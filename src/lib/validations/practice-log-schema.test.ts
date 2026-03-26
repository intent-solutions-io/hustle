import { describe, it, expect } from 'vitest';
import {
  practiceLogCreateSchema,
  practiceTypes,
  getPracticeTypeLabel,
  getFocusAreaLabel,
} from '@/lib/validations/practice-log-schema';

const validLog = {
  playerId: 'player-123',
  date: '2025-01-15',
  practiceType: 'team_practice' as const,
  durationMinutes: 90,
  focusAreas: ['passing', 'positioning'] as const,
};

describe('practiceLogCreateSchema', () => {
  it('accepts a valid practice log with required fields', () => {
    const result = practiceLogCreateSchema.safeParse(validLog);
    expect(result.success).toBe(true);
  });

  it('accepts a valid log with all optional fields', () => {
    const result = practiceLogCreateSchema.safeParse({
      ...validLog,
      teamName: 'Crusaders FC',
      location: 'Memorial Field',
      drillsCompleted: ['Rondo', 'Small-sided game'],
      intensity: 4,
      enjoyment: 5,
      improvement: 'First touch was much better today',
      notes: 'Focused on pressing high',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid practice type', () => {
    const result = practiceLogCreateSchema.safeParse({ ...validLog, practiceType: 'scrimmage' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid practice type');
    }
  });

  it('accepts all 6 practice types', () => {
    for (const practiceType of practiceTypes) {
      const result = practiceLogCreateSchema.safeParse({ ...validLog, practiceType });
      expect(result.success).toBe(true);
    }
  });

  it('rejects durationMinutes below minimum (4 < 5)', () => {
    const result = practiceLogCreateSchema.safeParse({ ...validLog, durationMinutes: 4 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 5 minutes');
    }
  });

  it('accepts durationMinutes at minimum boundary (5)', () => {
    const result = practiceLogCreateSchema.safeParse({ ...validLog, durationMinutes: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects durationMinutes exceeding maximum (481 > 480)', () => {
    const result = practiceLogCreateSchema.safeParse({ ...validLog, durationMinutes: 481 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot exceed 8 hours');
    }
  });

  it('accepts durationMinutes at maximum boundary (480)', () => {
    const result = practiceLogCreateSchema.safeParse({ ...validLog, durationMinutes: 480 });
    expect(result.success).toBe(true);
  });

  it('rejects empty focusAreas array', () => {
    const result = practiceLogCreateSchema.safeParse({ ...validLog, focusAreas: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Select at least one focus area');
    }
  });

  it('rejects focusAreas with more than 5 items', () => {
    const result = practiceLogCreateSchema.safeParse({
      ...validLog,
      focusAreas: ['passing', 'shooting', 'dribbling', 'defending', 'heading', 'first_touch'],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Select up to 5 focus areas');
    }
  });

  it('accepts focusAreas with exactly 5 items', () => {
    const result = practiceLogCreateSchema.safeParse({
      ...validLog,
      focusAreas: ['passing', 'shooting', 'dribbling', 'defending', 'heading'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid focus area', () => {
    const result = practiceLogCreateSchema.safeParse({
      ...validLog,
      focusAreas: ['sprinting'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing playerId', () => {
    const { playerId: _playerId, ...withoutPlayerId } = validLog;
    const result = practiceLogCreateSchema.safeParse(withoutPlayerId);
    expect(result.success).toBe(false);
  });
});

describe('getPracticeTypeLabel', () => {
  it('returns correct label for team_practice', () => {
    expect(getPracticeTypeLabel('team_practice')).toBe('Team Practice');
  });

  it('returns correct label for small_group', () => {
    expect(getPracticeTypeLabel('small_group')).toBe('Small Group Training');
  });

  it('returns correct label for individual', () => {
    expect(getPracticeTypeLabel('individual')).toBe('Individual Practice');
  });

  it('returns correct label for private_lesson', () => {
    expect(getPracticeTypeLabel('private_lesson')).toBe('Private Lesson');
  });

  it('returns correct label for camp', () => {
    expect(getPracticeTypeLabel('camp')).toBe('Soccer Camp');
  });

  it('returns correct label for clinic', () => {
    expect(getPracticeTypeLabel('clinic')).toBe('Skills Clinic');
  });
});

describe('getFocusAreaLabel', () => {
  it('returns correct label for passing', () => {
    expect(getFocusAreaLabel('passing')).toBe('Passing');
  });

  it('returns correct label for first_touch', () => {
    expect(getFocusAreaLabel('first_touch')).toBe('First Touch');
  });

  it('returns correct label for set_pieces', () => {
    expect(getFocusAreaLabel('set_pieces')).toBe('Set Pieces');
  });

  it('returns correct label for goalkeeping', () => {
    expect(getFocusAreaLabel('goalkeeping')).toBe('Goalkeeping');
  });

  it('returns correct label for tactics', () => {
    expect(getFocusAreaLabel('tactics')).toBe('Tactics');
  });

  it('returns correct label for other', () => {
    expect(getFocusAreaLabel('other')).toBe('Other');
  });
});
