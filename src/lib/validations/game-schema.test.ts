import { describe, it, expect } from 'vitest';
import { gameSchema } from '@/lib/validations/game-schema';

describe('game-schema validation', () => {
  describe('Basic field validation', () => {
    it('should accept valid game data', () => {
      const validData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High School',
        result: 'Win',
        yourScore: 3,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
        assists: 1,
      };

      const result = gameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require playerId', () => {
      const invalidData = {
        playerId: '',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('select an athlete');
      }
    });

    it('should require date', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require opponent', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: '',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate opponent length (min 3 chars)', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'FC', // Too short
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should validate opponent length (max 100 chars)', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'A'.repeat(101), // Too long
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 100 characters');
      }
    });
  });

  describe('XSS Prevention - Opponent Sanitization', () => {
    it('should reject script tags in opponent name', () => {
      const maliciousData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: '<script>alert("XSS")</script>',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(maliciousData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('invalid characters');
      }
    });

    it('should reject HTML tags in opponent name', () => {
      const maliciousData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: '<img src=x onerror=alert(1)>',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(maliciousData);
      expect(result.success).toBe(false);
    });

    it('should accept safe characters in opponent name', () => {
      const safeNames = [
        'Lincoln High School',
        "St. Mary's Academy",
        'River Valley FC',
        'Central High & Middle School',
        'Oak Ridge Prep',
      ];

      safeNames.forEach(name => {
        const data = {
          playerId: 'player-123',
          date: '2024-10-05',
          opponent: name,
          result: 'Win',
          yourScore: 2,
          opponentScore: 1,
          minutesPlayed: 90,
          goals: 1,
        };

        const result = gameSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Result-Score Consistency Validation', () => {
    it('should reject Win with losing score', () => {
      const inconsistentData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 1, // Losing!
        opponentScore: 3,
        minutesPlayed: 90,
        goals: 0,
      };

      const result = gameSchema.safeParse(inconsistentData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('does not match the score');
      }
    });

    it('should reject Loss with winning score', () => {
      const inconsistentData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Loss',
        yourScore: 3, // Winning!
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(inconsistentData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('does not match the score');
      }
    });

    it('should reject Draw with unequal scores', () => {
      const inconsistentData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Draw',
        yourScore: 2, // Not equal!
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(inconsistentData);
      expect(result.success).toBe(false);
    });

    it('should accept consistent Win result', () => {
      const consistentData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 3,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(consistentData);
      expect(result.success).toBe(true);
    });

    it('should accept consistent Loss result', () => {
      const consistentData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Loss',
        yourScore: 1,
        opponentScore: 3,
        minutesPlayed: 90,
        goals: 0,
      };

      const result = gameSchema.safeParse(consistentData);
      expect(result.success).toBe(true);
    });

    it('should accept consistent Draw result', () => {
      const consistentData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Draw',
        yourScore: 2,
        opponentScore: 2,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(consistentData);
      expect(result.success).toBe(true);
    });
  });

  describe('Future Date Prevention', () => {
    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const futureData = {
        playerId: 'player-123',
        date: futureDateStr,
        opponent: 'Future Team',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(futureData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be in the future');
      }
    });

    it('should accept today\'s date', () => {
      const today = new Date().toISOString().split('T')[0];

      const todayData = {
        playerId: 'player-123',
        date: today,
        opponent: 'Today Team',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(todayData);
      expect(result.success).toBe(true);
    });

    it('should accept past dates', () => {
      const pastDate = '2024-01-01';

      const pastData = {
        playerId: 'player-123',
        date: pastDate,
        opponent: 'Past Team',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(pastData);
      expect(result.success).toBe(true);
    });
  });

  describe('Clean Sheet Validation', () => {
    it('should reject clean sheet with goals conceded', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 0,
        saves: 5,
        goalsAgainst: 1, // Goals conceded!
        cleanSheet: true, // But claiming clean sheet!
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Clean sheet requires 0 goals against');
      }
    });

    it('should accept clean sheet with 0 goals against', () => {
      const validData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2,
        opponentScore: 0,
        minutesPlayed: 90,
        goals: 0,
        saves: 5,
        goalsAgainst: 0,
        cleanSheet: true,
      };

      const result = gameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Player Goals Validation', () => {
    it('should reject player goals exceeding team score', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2, // Team score
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 3, // Player scored more than team! Impossible!
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed team score');
      }
    });

    it('should accept player goals equal to team score (hat-trick scenario)', () => {
      const validData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 3,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 3, // Player scored all 3!
      };

      const result = gameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept player goals less than team score', () => {
      const validData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 3,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
      };

      const result = gameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Defensive Stats Validation', () => {
    it('should accept valid defensive stats', () => {
      const validData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 0,
        assists: 0,
        tackles: 8,
        interceptions: 4,
        clearances: 12,
        blocks: 3,
        aerialDuelsWon: 6,
      };

      const result = gameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject tackles exceeding max (50)', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 0,
        tackles: 51, // Over max!
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept nullable defensive stats', () => {
      const validData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 90,
        goals: 1,
        tackles: null,
        interceptions: null,
      };

      const result = gameSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Numeric Range Validation', () => {
    it('should reject negative scores', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: -1, // Negative!
        opponentScore: 0,
        minutesPlayed: 90,
        goals: 0,
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject excessive scores (>20)', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 25, // Too high!
        opponentScore: 0,
        minutesPlayed: 90,
        goals: 5,
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative minutes', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: -10, // Negative!
        goals: 1,
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject excessive minutes (>120)', () => {
      const invalidData = {
        playerId: 'player-123',
        date: '2024-10-05',
        opponent: 'Rival High',
        result: 'Win',
        yourScore: 2,
        opponentScore: 1,
        minutesPlayed: 150, // Too high!
        goals: 1,
      };

      const result = gameSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
