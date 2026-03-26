import { describe, it, expect } from 'vitest';
import {
  fitnessAssessmentCreateSchema,
  fitnessAssessmentUpdateSchema,
  fitnessAssessmentQuerySchema,
  fitnessTestTypes,
  validateAssessmentValue,
  calculateImprovement,
  timeToSeconds,
  secondsToTime,
} from '@/lib/validations/assessment-schema';

const validAssessment = {
  playerId: 'player-123',
  date: '2025-01-15',
  testType: 'beep_test' as const,
  value: 10,
  unit: 'level' as const,
};

describe('fitnessAssessmentCreateSchema', () => {
  it('accepts a valid assessment with required fields', () => {
    const result = fitnessAssessmentCreateSchema.safeParse(validAssessment);
    expect(result.success).toBe(true);
  });

  it('accepts a valid assessment with all optional fields', () => {
    const result = fitnessAssessmentCreateSchema.safeParse({
      ...validAssessment,
      percentile: 75,
      notes: 'Personal best',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid test type', () => {
    const result = fitnessAssessmentCreateSchema.safeParse({
      ...validAssessment,
      testType: 'broad_jump',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid test type');
    }
  });

  it('rejects a negative value', () => {
    const result = fitnessAssessmentCreateSchema.safeParse({ ...validAssessment, value: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be negative');
    }
  });

  it('accepts value of 0', () => {
    const result = fitnessAssessmentCreateSchema.safeParse({
      ...validAssessment,
      testType: 'pushups_1min',
      unit: 'count',
      value: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects percentile greater than 100', () => {
    const result = fitnessAssessmentCreateSchema.safeParse({
      ...validAssessment,
      percentile: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects percentile less than 0', () => {
    const result = fitnessAssessmentCreateSchema.safeParse({
      ...validAssessment,
      percentile: -1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts percentile at boundaries (0 and 100)', () => {
    expect(fitnessAssessmentCreateSchema.safeParse({ ...validAssessment, percentile: 0 }).success).toBe(true);
    expect(fitnessAssessmentCreateSchema.safeParse({ ...validAssessment, percentile: 100 }).success).toBe(true);
  });

  it('accepts all 8 test types', () => {
    const unitMap: Record<typeof fitnessTestTypes[number], string> = {
      beep_test: 'level',
      '40_yard_dash': 'seconds',
      pro_agility: 'seconds',
      vertical_jump: 'inches',
      plank_hold: 'seconds',
      pushups_1min: 'count',
      situps_1min: 'count',
      mile_run: 'time',
    };
    for (const testType of fitnessTestTypes) {
      const result = fitnessAssessmentCreateSchema.safeParse({
        ...validAssessment,
        testType,
        unit: unitMap[testType],
        value: 10,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('fitnessAssessmentUpdateSchema', () => {
  it('accepts an empty object (all fields partial)', () => {
    const result = fitnessAssessmentUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only notes', () => {
    const result = fitnessAssessmentUpdateSchema.safeParse({ notes: 'Updated notes' });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with value and percentile', () => {
    const result = fitnessAssessmentUpdateSchema.safeParse({ value: 15, percentile: 85 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid test type in partial update', () => {
    const result = fitnessAssessmentUpdateSchema.safeParse({ testType: 'sprint' });
    expect(result.success).toBe(false);
  });
});

describe('fitnessAssessmentQuerySchema', () => {
  it('accepts an empty object with defaults', () => {
    const result = fitnessAssessmentQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it('defaults limit to 50', () => {
    const result = fitnessAssessmentQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it('accepts explicit limit', () => {
    const result = fitnessAssessmentQuerySchema.safeParse({ limit: 25 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });

  it('rejects limit greater than 100', () => {
    const result = fitnessAssessmentQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts valid testType filter', () => {
    const result = fitnessAssessmentQuerySchema.safeParse({ testType: 'vertical_jump' });
    expect(result.success).toBe(true);
  });
});

describe('validateAssessmentValue', () => {
  it('returns valid for beep_test value within range (10)', () => {
    const result = validateAssessmentValue('beep_test', 10);
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('returns invalid with message for beep_test value below min (0 < 1)', () => {
    const result = validateAssessmentValue('beep_test', 0);
    expect(result.valid).toBe(false);
    expect(result.message).toBeDefined();
    expect(result.message).toContain('at least');
  });

  it('returns invalid for beep_test value above max (25 > 21)', () => {
    const result = validateAssessmentValue('beep_test', 25);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('cannot exceed');
  });

  it('returns valid for 40_yard_dash within range (5.5 seconds)', () => {
    const result = validateAssessmentValue('40_yard_dash', 5.5);
    expect(result.valid).toBe(true);
  });

  it('returns invalid for 40_yard_dash below min (3.0 < 4.0)', () => {
    const result = validateAssessmentValue('40_yard_dash', 3.0);
    expect(result.valid).toBe(false);
  });

  it('returns valid for beep_test at min boundary (1)', () => {
    const result = validateAssessmentValue('beep_test', 1);
    expect(result.valid).toBe(true);
  });

  it('returns valid for beep_test at max boundary (21)', () => {
    const result = validateAssessmentValue('beep_test', 21);
    expect(result.valid).toBe(true);
  });

  it('returns valid for vertical_jump within range (20 inches)', () => {
    const result = validateAssessmentValue('vertical_jump', 20);
    expect(result.valid).toBe(true);
  });
});

describe('calculateImprovement', () => {
  it('beep_test higher_better: 8 to 10 → improved=true, percentage=25', () => {
    const result = calculateImprovement('beep_test', 8, 10);
    expect(result.improved).toBe(true);
    expect(result.percentage).toBe(25);
  });

  it('beep_test higher_better: 10 to 8 → improved=false, percentage=-20', () => {
    const result = calculateImprovement('beep_test', 10, 8);
    expect(result.improved).toBe(false);
    expect(result.percentage).toBe(-20);
  });

  it('beep_test higher_better: same value → improved=false, percentage=0', () => {
    const result = calculateImprovement('beep_test', 10, 10);
    expect(result.improved).toBe(false);
    expect(result.percentage).toBe(0);
  });

  it('40_yard_dash lower_better: 6 to 5 → improved=true, positive percentage', () => {
    const result = calculateImprovement('40_yard_dash', 6, 5);
    expect(result.improved).toBe(true);
    // percentage = round((-(5-6) / 6) * 100) = round(1/6 * 100) = 17
    expect(result.percentage).toBe(17);
  });

  it('40_yard_dash lower_better: 5 to 6 → improved=false', () => {
    const result = calculateImprovement('40_yard_dash', 5, 6);
    expect(result.improved).toBe(false);
    expect(result.percentage).toBeLessThan(0);
  });

  it('oldValue=0 → percentage is null', () => {
    const result = calculateImprovement('beep_test', 0, 10);
    expect(result.percentage).toBeNull();
  });

  it('oldValue=0 higher_better with improvement → improved=true', () => {
    const result = calculateImprovement('beep_test', 0, 5);
    expect(result.improved).toBe(true);
    expect(result.percentage).toBeNull();
  });

  it('oldValue=0 lower_better with decrease → improved=true', () => {
    const result = calculateImprovement('40_yard_dash', 0, -1);
    expect(result.improved).toBe(true);
    expect(result.percentage).toBeNull();
  });
});

describe('timeToSeconds', () => {
  it('converts 6:30 to 390 seconds', () => {
    expect(timeToSeconds('6:30')).toBe(390);
  });

  it('converts 0:45 to 45 seconds', () => {
    expect(timeToSeconds('0:45')).toBe(45);
  });

  it('converts 10:00 to 600 seconds', () => {
    expect(timeToSeconds('10:00')).toBe(600);
  });

  it('throws on invalid format (no colon)', () => {
    expect(() => timeToSeconds('630')).toThrow();
  });

  it('throws on invalid format (letters)', () => {
    expect(() => timeToSeconds('six:thirty')).toThrow();
  });

  it('throws on invalid format (three parts)', () => {
    expect(() => timeToSeconds('1:06:30')).toThrow();
  });
});

describe('secondsToTime', () => {
  it('converts 390 seconds to 6:30', () => {
    expect(secondsToTime(390)).toBe('6:30');
  });

  it('converts 45 seconds to 0:45', () => {
    expect(secondsToTime(45)).toBe('0:45');
  });

  it('converts 600 seconds to 10:00', () => {
    expect(secondsToTime(600)).toBe('10:00');
  });

  it('pads single-digit seconds with leading zero', () => {
    expect(secondsToTime(61)).toBe('1:01');
  });

  it('converts 0 seconds to 0:00', () => {
    expect(secondsToTime(0)).toBe('0:00');
  });
});
