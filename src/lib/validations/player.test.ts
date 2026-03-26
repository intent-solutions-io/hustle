import { describe, it, expect } from 'vitest';
import { playerSchema, soccerPositionCodes, leagueCodes } from '@/lib/validations/player';

const validPlayer = {
  name: 'Alex Smith',
  birthday: '2015-06-15',
  gender: 'male' as const,
  primaryPosition: 'CM' as const,
  teamClub: 'Test FC',
  leagueCode: 'local_rec' as const,
};

describe('playerSchema', () => {
  describe('exports', () => {
    it('exports soccerPositionCodes with 13 positions', () => {
      expect(soccerPositionCodes).toHaveLength(13);
      expect(soccerPositionCodes).toContain('GK');
      expect(soccerPositionCodes).toContain('CF');
    });

    it('exports leagueCodes including other', () => {
      expect(leagueCodes).toContain('other');
      expect(leagueCodes).toContain('local_rec');
      expect(leagueCodes).toContain('ecnl_girls');
    });
  });

  describe('valid data', () => {
    it('accepts valid player with all required fields', () => {
      const result = playerSchema.safeParse(validPlayer);
      expect(result.success).toBe(true);
    });

    it('accepts valid player with all optional fields', () => {
      const result = playerSchema.safeParse({
        ...validPlayer,
        secondaryPositions: ['GK', 'ST'],
        positionNote: 'Can play defensive mid',
        leagueOtherName: undefined,
        photoUrl: 'https://example.com/photo.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('accepts photoUrl as null', () => {
      const result = playerSchema.safeParse({ ...validPlayer, photoUrl: null });
      expect(result.success).toBe(true);
    });

    it('accepts photoUrl as a string', () => {
      const result = playerSchema.safeParse({
        ...validPlayer,
        photoUrl: 'https://example.com/photo.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('accepts gender female', () => {
      const result = playerSchema.safeParse({ ...validPlayer, gender: 'female' });
      expect(result.success).toBe(true);
    });

    it('accepts a 10-year-old birthday', () => {
      const today = new Date();
      const birthday = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      const result = playerSchema.safeParse({
        ...validPlayer,
        birthday: birthday.toISOString().split('T')[0],
      });
      expect(result.success).toBe(true);
    });

    it('accepts secondaryPositions with 3 valid items', () => {
      const result = playerSchema.safeParse({
        ...validPlayer,
        primaryPosition: 'GK',
        secondaryPositions: ['CB', 'RB', 'LB'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts leagueCode other with leagueOtherName provided', () => {
      const result = playerSchema.safeParse({
        ...validPlayer,
        leagueCode: 'other',
        leagueOtherName: 'My Custom League',
      });
      expect(result.success).toBe(true);
    });

    it('accepts non-other leagueCode without leagueOtherName', () => {
      const result = playerSchema.safeParse({
        ...validPlayer,
        leagueCode: 'ecnl_girls',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('name validation', () => {
    it('rejects empty name', () => {
      const result = playerSchema.safeParse({ ...validPlayer, name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects name with 1 character', () => {
      const result = playerSchema.safeParse({ ...validPlayer, name: 'A' });
      expect(result.success).toBe(false);
    });

    it('rejects name exceeding 100 characters', () => {
      const result = playerSchema.safeParse({ ...validPlayer, name: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('accepts name at exactly 2 characters', () => {
      const result = playerSchema.safeParse({ ...validPlayer, name: 'Jo' });
      expect(result.success).toBe(true);
    });

    it('accepts name at exactly 100 characters', () => {
      const result = playerSchema.safeParse({ ...validPlayer, name: 'A'.repeat(100) });
      expect(result.success).toBe(true);
    });
  });

  describe('birthday validation', () => {
    it('rejects birthday for player younger than 5 years old', () => {
      const today = new Date();
      const tooYoung = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
      const result = playerSchema.safeParse({
        ...validPlayer,
        birthday: tooYoung.toISOString().split('T')[0],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('between 5 and 25 years old');
      }
    });

    it('rejects birthday for player older than 25 years old', () => {
      const today = new Date();
      const tooOld = new Date(today.getFullYear() - 26, today.getMonth(), today.getDate());
      const result = playerSchema.safeParse({
        ...validPlayer,
        birthday: tooOld.toISOString().split('T')[0],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('between 5 and 25 years old');
      }
    });

    it('accepts birthday on the 5th birthday exactly', () => {
      const today = new Date();
      const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      const result = playerSchema.safeParse({
        ...validPlayer,
        birthday: fiveYearsAgo.toISOString().split('T')[0],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('gender validation', () => {
    it('rejects invalid gender', () => {
      const result = playerSchema.safeParse({ ...validPlayer, gender: 'other' });
      expect(result.success).toBe(false);
    });

    it('accepts gender male', () => {
      const result = playerSchema.safeParse({ ...validPlayer, gender: 'male' });
      expect(result.success).toBe(true);
    });
  });

  describe('primaryPosition validation', () => {
    it('rejects invalid position code', () => {
      const result = playerSchema.safeParse({ ...validPlayer, primaryPosition: 'FWD' });
      expect(result.success).toBe(false);
    });

    it('accepts GK as primary position', () => {
      const result = playerSchema.safeParse({ ...validPlayer, primaryPosition: 'GK' });
      expect(result.success).toBe(true);
    });

    it('accepts CB as primary position', () => {
      const result = playerSchema.safeParse({ ...validPlayer, primaryPosition: 'CB' });
      expect(result.success).toBe(true);
    });

    it('accepts ST as primary position', () => {
      const result = playerSchema.safeParse({ ...validPlayer, primaryPosition: 'ST' });
      expect(result.success).toBe(true);
    });

    it('accepts all 13 position codes', () => {
      for (const position of soccerPositionCodes) {
        const result = playerSchema.safeParse({ ...validPlayer, primaryPosition: position });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('secondaryPositions validation', () => {
    it('rejects secondaryPositions array with 4 items', () => {
      const result = playerSchema.safeParse({
        ...validPlayer,
        primaryPosition: 'GK',
        secondaryPositions: ['CB', 'RB', 'LB', 'DM'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects secondaryPositions that include the primaryPosition', () => {
      const result = playerSchema.safeParse({
        ...validPlayer,
        primaryPosition: 'CM',
        secondaryPositions: ['GK', 'CM'],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('secondaryPositions'));
        expect(issue?.message).toContain('cannot include the primary position');
      }
    });
  });

  describe('leagueCode / leagueOtherName validation', () => {
    it('rejects leagueCode other without leagueOtherName', () => {
      const result = playerSchema.safeParse({
        ...validPlayer,
        leagueCode: 'other',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('leagueOtherName'));
        expect(issue?.message).toContain('enter the league name');
      }
    });

    it('rejects leagueCode other with empty leagueOtherName', () => {
      const result = playerSchema.safeParse({
        ...validPlayer,
        leagueCode: 'other',
        leagueOtherName: '   ',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('teamClub validation', () => {
    it('rejects teamClub with 1 character', () => {
      const result = playerSchema.safeParse({ ...validPlayer, teamClub: 'A' });
      expect(result.success).toBe(false);
    });

    it('rejects teamClub exceeding 100 characters', () => {
      const result = playerSchema.safeParse({ ...validPlayer, teamClub: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('accepts teamClub at exactly 2 characters', () => {
      const result = playerSchema.safeParse({ ...validPlayer, teamClub: 'FC' });
      expect(result.success).toBe(true);
    });
  });
});
