import { describe, it, expect } from 'vitest';
import {
  journalEntryCreateSchema,
  journalEntryUpdateSchema,
  journalEntryQuerySchema,
  quickJournalEntrySchema,
  journalContexts,
  journalMoodTags,
} from '@/lib/validations/journal-schema';

const validEntry = {
  playerId: 'player-123',
  date: '2025-01-15',
  content: 'Had a great training session today. Worked on my weak foot.',
  context: 'workout_reflection' as const,
};

describe('journalEntryCreateSchema', () => {
  it('accepts a valid entry with required fields', () => {
    const result = journalEntryCreateSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('accepts a valid entry with all optional fields', () => {
    const result = journalEntryCreateSchema.safeParse({
      ...validEntry,
      moodTag: 'great',
      energyTag: 'energized',
      linkedWorkoutId: 'workout-abc',
      linkedGameId: 'game-xyz',
    });
    expect(result.success).toBe(true);
  });

  it('rejects content exceeding 5000 characters', () => {
    const result = journalEntryCreateSchema.safeParse({
      ...validEntry,
      content: 'A'.repeat(5001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('5000 characters');
    }
  });

  it('accepts content at exactly 5000 characters', () => {
    const result = journalEntryCreateSchema.safeParse({
      ...validEntry,
      content: 'A'.repeat(5000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = journalEntryCreateSchema.safeParse({ ...validEntry, content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid context', () => {
    const result = journalEntryCreateSchema.safeParse({ ...validEntry, context: 'training_log' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid journal context');
    }
  });

  it('accepts all 5 journal contexts', () => {
    for (const context of journalContexts) {
      const result = journalEntryCreateSchema.safeParse({ ...validEntry, context });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all 5 mood tags', () => {
    for (const moodTag of journalMoodTags) {
      const result = journalEntryCreateSchema.safeParse({ ...validEntry, moodTag });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an invalid mood tag', () => {
    const result = journalEntryCreateSchema.safeParse({ ...validEntry, moodTag: 'happy' });
    expect(result.success).toBe(false);
  });

  it('accepts moodTag as null', () => {
    const result = journalEntryCreateSchema.safeParse({ ...validEntry, moodTag: null });
    expect(result.success).toBe(true);
  });
});

describe('journalEntryUpdateSchema', () => {
  it('accepts an empty object (all fields partial)', () => {
    const result = journalEntryUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only content', () => {
    const result = journalEntryUpdateSchema.safeParse({
      content: 'Updated reflection content',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial update with only moodTag', () => {
    const result = journalEntryUpdateSchema.safeParse({ moodTag: 'good' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid context in partial update', () => {
    const result = journalEntryUpdateSchema.safeParse({ context: 'invalid_context' });
    expect(result.success).toBe(false);
  });
});

describe('journalEntryQuerySchema', () => {
  it('accepts an empty object with defaults', () => {
    const result = journalEntryQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('defaults limit to 20', () => {
    const result = journalEntryQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('accepts explicit limit', () => {
    const result = journalEntryQuerySchema.safeParse({ limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit greater than 100', () => {
    const result = journalEntryQuerySchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts valid context filter', () => {
    const result = journalEntryQuerySchema.safeParse({ context: 'game_reflection' });
    expect(result.success).toBe(true);
  });

  it('accepts valid moodTag filter', () => {
    const result = journalEntryQuerySchema.safeParse({ moodTag: 'okay' });
    expect(result.success).toBe(true);
  });
});

describe('quickJournalEntrySchema', () => {
  it('accepts a valid quick entry', () => {
    const result = quickJournalEntrySchema.safeParse({
      playerId: 'player-123',
      content: 'Feeling good today!',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a quick entry with optional moodTag', () => {
    const result = quickJournalEntrySchema.safeParse({
      playerId: 'player-123',
      content: 'Rough practice.',
      moodTag: 'struggling',
    });
    expect(result.success).toBe(true);
  });

  it('rejects content exceeding 500 characters', () => {
    const result = quickJournalEntrySchema.safeParse({
      playerId: 'player-123',
      content: 'A'.repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('500 characters');
    }
  });

  it('accepts content at exactly 500 characters', () => {
    const result = quickJournalEntrySchema.safeParse({
      playerId: 'player-123',
      content: 'A'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = quickJournalEntrySchema.safeParse({
      playerId: 'player-123',
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing playerId', () => {
    const result = quickJournalEntrySchema.safeParse({ content: 'Some content' });
    expect(result.success).toBe(false);
  });
});
