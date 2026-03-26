import { describe, it, expect } from 'vitest';
import {
  cardioLogCreateSchema,
  cardioActivityTypes,
  calculatePace,
} from '@/lib/validations/cardio-log-schema';

const validLog = {
  playerId: 'player-123',
  date: '2025-01-15',
  activityType: 'run' as const,
  distanceMiles: 3.1,
  durationMinutes: 28,
};

describe('cardioLogCreateSchema', () => {
  it('accepts a valid cardio log with required fields', () => {
    const result = cardioLogCreateSchema.safeParse(validLog);
    expect(result.success).toBe(true);
  });

  it('accepts a valid log with all optional fields', () => {
    const result = cardioLogCreateSchema.safeParse({
      ...validLog,
      avgPacePerMile: '9:00',
      calories: 320,
      avgHeartRate: 155,
      maxHeartRate: 180,
      location: 'City Park',
      weather: 'Sunny, 65F',
      notes: 'Easy morning run',
      perceivedEffort: '3',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid activity type', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, activityType: 'walk' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid activity type');
    }
  });

  it('accepts all 6 activity types', () => {
    for (const activityType of cardioActivityTypes) {
      const result = cardioLogCreateSchema.safeParse({ ...validLog, activityType });
      expect(result.success).toBe(true);
    }
  });

  it('rejects distanceMiles of 0', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, distanceMiles: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 0.01 miles');
    }
  });

  it('rejects distanceMiles below minimum (0.005)', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, distanceMiles: 0.005 });
    expect(result.success).toBe(false);
  });

  it('accepts distanceMiles at minimum boundary (0.01)', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, distanceMiles: 0.01 });
    expect(result.success).toBe(true);
  });

  it('rejects distanceMiles exceeding 100 miles', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, distanceMiles: 101 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot exceed 100 miles');
    }
  });

  it('accepts distanceMiles at maximum boundary (100)', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, distanceMiles: 100 });
    expect(result.success).toBe(true);
  });

  it('rejects durationMinutes of 0', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, durationMinutes: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 1 minute');
    }
  });

  it('rejects durationMinutes exceeding 600', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, durationMinutes: 601 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot exceed 10 hours');
    }
  });

  it('accepts durationMinutes at boundaries (1 and 600)', () => {
    expect(cardioLogCreateSchema.safeParse({ ...validLog, durationMinutes: 1 }).success).toBe(true);
    expect(cardioLogCreateSchema.safeParse({ ...validLog, durationMinutes: 600 }).success).toBe(true);
  });

  it('rejects avgPacePerMile with invalid format (not mm:ss)', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, avgPacePerMile: '9.5' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('mm:ss format');
    }
  });

  it('rejects avgPacePerMile with no leading digit before colon', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, avgPacePerMile: ':30' });
    expect(result.success).toBe(false);
  });

  it('accepts avgPacePerMile as null', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, avgPacePerMile: null });
    expect(result.success).toBe(true);
  });

  it('accepts avgPacePerMile in valid mm:ss format', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, avgPacePerMile: '8:30' });
    expect(result.success).toBe(true);
  });

  it('accepts avgPacePerMile in single-digit minute format (m:ss)', () => {
    const result = cardioLogCreateSchema.safeParse({ ...validLog, avgPacePerMile: '7:45' });
    expect(result.success).toBe(true);
  });
});

describe('calculatePace', () => {
  it('calculates 8:00 pace for 3 miles in 24 minutes', () => {
    expect(calculatePace(3, 24)).toBe('8:00');
  });

  it('returns 0:00 for distance of 0', () => {
    expect(calculatePace(0, 30)).toBe('0:00');
  });

  it('returns 0:00 for negative distance', () => {
    expect(calculatePace(-1, 30)).toBe('0:00');
  });

  it('calculates 7:30 pace for 1 mile in 7.5 minutes', () => {
    expect(calculatePace(1, 7.5)).toBe('7:30');
  });

  it('calculates correct pace for a half-mile in 5 minutes (10:00 per mile)', () => {
    expect(calculatePace(0.5, 5)).toBe('10:00');
  });

  it('calculates correct pace for 5k (3.1 miles) in 31 minutes (~10:00 per mile)', () => {
    const pace = calculatePace(3.1, 31);
    // 31 / 3.1 = 10 min/mile exactly
    expect(pace).toBe('10:00');
  });

  it('pads single-digit seconds with leading zero', () => {
    // 1 mile in 9 minutes 5 seconds = 9 + 5/60 = 9.0833 minutes
    const pace = calculatePace(1, 9 + 5 / 60);
    expect(pace).toBe('9:05');
  });
});
