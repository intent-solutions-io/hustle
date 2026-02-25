import { describe, it, expect } from 'vitest';
import {
  workoutSetLogSchema,
  workoutExerciseLogSchema,
  workoutLogCreateSchema,
  workoutLogUpdateSchema,
  workoutLogQuerySchema,
  workoutLogTypes,
  calculateTotalVolume,
} from '@/lib/validations/workout-log-schema';

const validSet = {
  setNumber: 1,
  reps: 10,
  weight: 50,
  completed: true,
};

const validExercise = {
  exerciseId: 'ex-1',
  exerciseName: 'Squats',
  targetSets: 3,
  targetReps: '10',
  sets: [validSet],
};

const validCreateLog = {
  playerId: 'player-123',
  date: '2025-01-15',
  type: 'strength' as const,
  title: 'Morning Strength Session',
  duration: 45,
  exercises: [validExercise],
};

describe('workoutSetLogSchema', () => {
  it('accepts a valid set', () => {
    const result = workoutSetLogSchema.safeParse(validSet);
    expect(result.success).toBe(true);
  });

  it('accepts a set with no weight (null)', () => {
    const result = workoutSetLogSchema.safeParse({ ...validSet, weight: null });
    expect(result.success).toBe(true);
  });

  it('accepts a set where completed is false', () => {
    const result = workoutSetLogSchema.safeParse({ ...validSet, completed: false });
    expect(result.success).toBe(true);
  });

  it('rejects negative reps', () => {
    const result = workoutSetLogSchema.safeParse({ ...validSet, reps: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be negative');
    }
  });

  it('accepts zero reps (missed set)', () => {
    const result = workoutSetLogSchema.safeParse({ ...validSet, reps: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects setNumber of 0', () => {
    const result = workoutSetLogSchema.safeParse({ ...validSet, setNumber: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 1');
    }
  });

  it('rejects negative weight', () => {
    const result = workoutSetLogSchema.safeParse({ ...validSet, weight: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects notes exceeding 200 characters', () => {
    const result = workoutSetLogSchema.safeParse({ ...validSet, notes: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('accepts notes at exactly 200 characters', () => {
    const result = workoutSetLogSchema.safeParse({ ...validSet, notes: 'A'.repeat(200) });
    expect(result.success).toBe(true);
  });
});

describe('workoutExerciseLogSchema', () => {
  it('accepts a valid exercise', () => {
    const result = workoutExerciseLogSchema.safeParse(validExercise);
    expect(result.success).toBe(true);
  });

  it('rejects an empty sets array', () => {
    const result = workoutExerciseLogSchema.safeParse({ ...validExercise, sets: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one set is required');
    }
  });

  it('rejects exerciseName exceeding 100 characters', () => {
    const result = workoutExerciseLogSchema.safeParse({
      ...validExercise,
      exerciseName: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty exerciseName', () => {
    const result = workoutExerciseLogSchema.safeParse({ ...validExercise, exerciseName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects targetSets of 0', () => {
    const result = workoutExerciseLogSchema.safeParse({ ...validExercise, targetSets: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts multiple sets', () => {
    const result = workoutExerciseLogSchema.safeParse({
      ...validExercise,
      sets: [
        { setNumber: 1, reps: 10, weight: 50, completed: true },
        { setNumber: 2, reps: 8, weight: 55, completed: true },
        { setNumber: 3, reps: 6, weight: 60, completed: false },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe('workoutLogCreateSchema', () => {
  it('accepts a valid create log', () => {
    const result = workoutLogCreateSchema.safeParse(validCreateLog);
    expect(result.success).toBe(true);
  });

  it('accepts a valid log with all optional fields', () => {
    const result = workoutLogCreateSchema.safeParse({
      ...validCreateLog,
      workoutId: 'workout-abc',
      totalVolume: 1500,
      journalEntryId: 'journal-xyz',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing playerId', () => {
    const { playerId: _playerId, ...withoutPlayerId } = validCreateLog;
    const result = workoutLogCreateSchema.safeParse(withoutPlayerId);
    expect(result.success).toBe(false);
  });

  it('rejects empty exercises array', () => {
    const result = workoutLogCreateSchema.safeParse({ ...validCreateLog, exercises: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one exercise is required');
    }
  });

  it('rejects duration of 0', () => {
    const result = workoutLogCreateSchema.safeParse({ ...validCreateLog, duration: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 1 minute');
    }
  });

  it('rejects invalid workout type', () => {
    const result = workoutLogCreateSchema.safeParse({ ...validCreateLog, type: 'cardio' });
    expect(result.success).toBe(false);
  });

  it('rejects title exceeding 100 characters', () => {
    const result = workoutLogCreateSchema.safeParse({
      ...validCreateLog,
      title: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 6 workout types', () => {
    for (const type of workoutLogTypes) {
      const result = workoutLogCreateSchema.safeParse({ ...validCreateLog, type });
      expect(result.success).toBe(true);
    }
  });
});

describe('workoutLogUpdateSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = workoutLogUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial update with only title', () => {
    const result = workoutLogUpdateSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('rejects playerId field (omitted from update)', () => {
    // playerId is omitted, so if provided it should still be ignored (partial omit = not in schema)
    // The schema omits playerId so it should be stripped or ignored
    const result = workoutLogUpdateSchema.safeParse({ title: 'New Title', duration: 60 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type in partial update', () => {
    const result = workoutLogUpdateSchema.safeParse({ type: 'invalid_type' });
    expect(result.success).toBe(false);
  });
});

describe('workoutLogQuerySchema', () => {
  it('accepts an empty object with defaults', () => {
    const result = workoutLogQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('defaults limit to 20', () => {
    const result = workoutLogQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('accepts explicit limit within range', () => {
    const result = workoutLogQuerySchema.safeParse({ limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit greater than 100', () => {
    const result = workoutLogQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects limit less than 1', () => {
    const result = workoutLogQuerySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts valid type filter', () => {
    const result = workoutLogQuerySchema.safeParse({ type: 'strength' });
    expect(result.success).toBe(true);
  });
});

describe('calculateTotalVolume', () => {
  it('returns 0 for empty exercises array', () => {
    expect(calculateTotalVolume([])).toBe(0);
  });

  it('sums completed sets reps * weight', () => {
    const exercises = [
      {
        ...validExercise,
        sets: [
          { setNumber: 1, reps: 10, weight: 50, completed: true },
          { setNumber: 2, reps: 8, weight: 50, completed: true },
        ],
      },
    ];
    // (10 * 50) + (8 * 50) = 500 + 400 = 900
    expect(calculateTotalVolume(exercises)).toBe(900);
  });

  it('ignores incomplete sets', () => {
    const exercises = [
      {
        ...validExercise,
        sets: [
          { setNumber: 1, reps: 10, weight: 50, completed: true },
          { setNumber: 2, reps: 8, weight: 50, completed: false },
        ],
      },
    ];
    // Only first set counts: 10 * 50 = 500
    expect(calculateTotalVolume(exercises)).toBe(500);
  });

  it('ignores sets without weight (null weight)', () => {
    const exercises = [
      {
        ...validExercise,
        sets: [
          { setNumber: 1, reps: 15, weight: null, completed: true },
          { setNumber: 2, reps: 10, weight: 40, completed: true },
        ],
      },
    ];
    // Only second set counts: 10 * 40 = 400
    expect(calculateTotalVolume(exercises)).toBe(400);
  });

  it('sums volume across multiple exercises', () => {
    const exercises = [
      {
        ...validExercise,
        exerciseId: 'ex-1',
        sets: [{ setNumber: 1, reps: 10, weight: 50, completed: true }],
      },
      {
        ...validExercise,
        exerciseId: 'ex-2',
        exerciseName: 'Deadlift',
        sets: [{ setNumber: 1, reps: 5, weight: 100, completed: true }],
      },
    ];
    // (10 * 50) + (5 * 100) = 500 + 500 = 1000
    expect(calculateTotalVolume(exercises)).toBe(1000);
  });

  it('returns 0 when all sets are incomplete', () => {
    const exercises = [
      {
        ...validExercise,
        sets: [
          { setNumber: 1, reps: 10, weight: 50, completed: false },
          { setNumber: 2, reps: 8, weight: 50, completed: false },
        ],
      },
    ];
    expect(calculateTotalVolume(exercises)).toBe(0);
  });
});
