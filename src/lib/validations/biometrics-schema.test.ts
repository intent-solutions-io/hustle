import { describe, it, expect } from 'vitest';
import {
  biometricsLogCreateSchema,
  biometricsSources,
  calculateRecoveryScore,
} from '@/lib/validations/biometrics-schema';

const validBiometrics = {
  playerId: 'player-123',
  date: '2025-01-15',
  source: 'manual' as const,
};

describe('biometricsLogCreateSchema', () => {
  it('accepts a valid log with only required fields', () => {
    const result = biometricsLogCreateSchema.safeParse(validBiometrics);
    expect(result.success).toBe(true);
  });

  it('accepts a valid log with all fields', () => {
    const result = biometricsLogCreateSchema.safeParse({
      ...validBiometrics,
      restingHeartRate: 58,
      maxHeartRate: 195,
      avgHeartRate: 145,
      hrv: 85,
      sleepScore: 78,
      sleepHours: 8.5,
      steps: 10000,
      activeMinutes: 60,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing source', () => {
    const { source: _source, ...withoutSource } = validBiometrics;
    const result = biometricsLogCreateSchema.safeParse(withoutSource);
    expect(result.success).toBe(false);
  });

  it('rejects invalid source', () => {
    const result = biometricsLogCreateSchema.safeParse({ ...validBiometrics, source: 'whoop' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid biometrics source');
    }
  });

  it('accepts all 5 sources', () => {
    for (const source of biometricsSources) {
      const result = biometricsLogCreateSchema.safeParse({ ...validBiometrics, source });
      expect(result.success).toBe(true);
    }
  });

  it('rejects restingHeartRate below minimum (29)', () => {
    const result = biometricsLogCreateSchema.safeParse({
      ...validBiometrics,
      restingHeartRate: 29,
    });
    expect(result.success).toBe(false);
  });

  it('rejects restingHeartRate above maximum (221)', () => {
    const result = biometricsLogCreateSchema.safeParse({
      ...validBiometrics,
      restingHeartRate: 221,
    });
    expect(result.success).toBe(false);
  });

  it('accepts restingHeartRate at boundaries (30 and 220)', () => {
    expect(
      biometricsLogCreateSchema.safeParse({ ...validBiometrics, restingHeartRate: 30 }).success,
    ).toBe(true);
    expect(
      biometricsLogCreateSchema.safeParse({ ...validBiometrics, restingHeartRate: 220 }).success,
    ).toBe(true);
  });

  it('rejects sleepHours greater than 24', () => {
    const result = biometricsLogCreateSchema.safeParse({ ...validBiometrics, sleepHours: 25 });
    expect(result.success).toBe(false);
  });

  it('accepts sleepHours at boundary (24)', () => {
    const result = biometricsLogCreateSchema.safeParse({ ...validBiometrics, sleepHours: 24 });
    expect(result.success).toBe(true);
  });

  it('rejects sleepScore greater than 100', () => {
    const result = biometricsLogCreateSchema.safeParse({ ...validBiometrics, sleepScore: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects hrv greater than 300', () => {
    const result = biometricsLogCreateSchema.safeParse({ ...validBiometrics, hrv: 301 });
    expect(result.success).toBe(false);
  });

  it('accepts nullable optional fields', () => {
    const result = biometricsLogCreateSchema.safeParse({
      ...validBiometrics,
      restingHeartRate: null,
      hrv: null,
      sleepScore: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('calculateRecoveryScore', () => {
  it('returns null when no metrics are provided', () => {
    expect(calculateRecoveryScore({})).toBeNull();
    expect(calculateRecoveryScore({ restingHeartRate: null, hrv: null, sleepScore: null })).toBeNull();
  });

  it('returns a score when only HRV is provided (high HRV = high score)', () => {
    // HRV 120ms: ((120 - 40) / 80) * 40 = (80/80) * 40 = 40 → max HRV contribution
    // Total: 40/40 = 100
    const score = calculateRecoveryScore({ hrv: 120 });
    expect(score).not.toBeNull();
    expect(score).toBe(100);
  });

  it('returns a low score when only HRV is provided (low HRV)', () => {
    // HRV 40ms: ((40 - 40) / 80) * 40 = 0 → score 0/40 = 0
    const score = calculateRecoveryScore({ hrv: 40 });
    expect(score).not.toBeNull();
    expect(score).toBe(0);
  });

  it('returns 100 when only sleepScore is 100', () => {
    // (100/100) * 40 = 40 → 40/40 = 100
    const score = calculateRecoveryScore({ sleepScore: 100 });
    expect(score).toBe(100);
  });

  it('returns 0 when only sleepScore is 0', () => {
    // (0/100) * 40 = 0 → 0/40 = 0
    const score = calculateRecoveryScore({ sleepScore: 0 });
    expect(score).toBe(0);
  });

  it('returns a high score when only resting HR is low (50 bpm = ideal)', () => {
    // rhrScore = 20 - ((50 - 50) / 30) * 20 = 20 → min(20, max(0, 20)) = 20
    // 20/20 = 100
    const score = calculateRecoveryScore({ restingHeartRate: 50 });
    expect(score).toBe(100);
  });

  it('returns a low score when only resting HR is high (80 bpm)', () => {
    // rhrScore = 20 - ((80 - 50) / 30) * 20 = 20 - 20 = 0 → 0/20 = 0
    const score = calculateRecoveryScore({ restingHeartRate: 80 });
    expect(score).toBe(0);
  });

  it('returns a number between 0 and 100 for combined metrics', () => {
    const score = calculateRecoveryScore({
      hrv: 80,
      sleepScore: 75,
      restingHeartRate: 60,
    });
    expect(score).not.toBeNull();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns a high combined score for all-good metrics', () => {
    // HRV 120 → 40pts, sleepScore 100 → 40pts, restingHR 50 → 20pts = 100/100 = 100
    const score = calculateRecoveryScore({
      hrv: 120,
      sleepScore: 100,
      restingHeartRate: 50,
    });
    expect(score).toBe(100);
  });
});
