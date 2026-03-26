import { describe, it, expect } from 'vitest';
import {
  formatGameStats,
  calculateAthleteStats,
  formatGameDate,
  formatGameDateMobile,
  getResultBadgeClasses,
  isGoalkeeper,
  isValidGameResult,
  calculateWinPercentage,
  getMostRecentGame,
  filterGamesByDateRange,
} from '@/lib/game-utils';
import type { GameData } from '@/types/game';

describe('game-utils', () => {
  describe('formatGameStats()', () => {
    it('should format field player stats (goals and assists)', () => {
      const game: Partial<GameData> = {
        goals: 2,
        assists: 1,
        tackles: 0,
        interceptions: 0,
        clearances: 0,
        blocks: 0,
        aerialDuelsWon: 0,
      };

      const result = formatGameStats(game as GameData, 'Forward');
      expect(result).toBe('2G, 1A');
    });

    it('should format field player stats with defensive stats', () => {
      const game: Partial<GameData> = {
        goals: 1,
        assists: 0,
        tackles: 8,
        interceptions: 4,
        clearances: 12,
        blocks: 3,
        aerialDuelsWon: 6,
      };

      const result = formatGameStats(game as GameData, 'Defender');
      expect(result).toBe('1G, 8T, 4I, 12C, 3B, 6AD');
    });

    it('should format goalkeeper stats (saves, goals against, clean sheet)', () => {
      const game: Partial<GameData> = {
        goals: 0,
        assists: 0,
        saves: 5,
        goalsAgainst: 2,
        cleanSheet: false,
      };

      const result = formatGameStats(game as GameData, 'Goalkeeper');
      expect(result).toBe('5 saves, 2 GA');
    });

    it('should show clean sheet indicator for goalkeepers', () => {
      const game: Partial<GameData> = {
        goals: 0,
        saves: 3,
        goalsAgainst: 0,
        cleanSheet: true,
      };

      const result = formatGameStats(game as GameData, 'Goalkeeper');
      expect(result).toBe('3 saves, 0 GA, CS');
    });

    it('should return "-" for field player with no stats', () => {
      const game: Partial<GameData> = {
        goals: 0,
        assists: 0,
        tackles: 0,
        interceptions: 0,
        clearances: 0,
        blocks: 0,
        aerialDuelsWon: 0,
      };

      const result = formatGameStats(game as GameData, 'Midfielder');
      expect(result).toBe('-');
    });

    it('should only show non-zero defensive stats', () => {
      const game: Partial<GameData> = {
        goals: 0,
        assists: 0,
        tackles: 5,
        interceptions: 0,
        clearances: 10,
        blocks: 0,
        aerialDuelsWon: 0,
      };

      const result = formatGameStats(game as GameData, 'Defender');
      expect(result).toBe('5T, 10C');
    });
  });

  describe('calculateAthleteStats()', () => {
    it('should calculate aggregated stats from games array', () => {
      const games: Partial<GameData>[] = [
        { goals: 2, assists: 1, minutesPlayed: 90, cleanSheet: false },
        { goals: 1, assists: 2, minutesPlayed: 80, cleanSheet: false },
        { goals: 0, assists: 1, minutesPlayed: 75, cleanSheet: false },
      ];

      const stats = calculateAthleteStats(games as GameData[]);

      expect(stats.totalGames).toBe(3);
      expect(stats.totalGoals).toBe(3);
      expect(stats.totalAssists).toBe(4);
      expect(stats.totalMinutes).toBe(245);
      expect(stats.averageMinutesPerGame).toBe(82); // 245 / 3 rounded
      expect(stats.goalsPerGame).toBe(1); // 3 / 3
    });

    it('should calculate clean sheets for goalkeepers', () => {
      const games: Partial<GameData>[] = [
        { goals: 0, assists: 0, minutesPlayed: 90, cleanSheet: true },
        { goals: 0, assists: 0, minutesPlayed: 90, cleanSheet: false },
        { goals: 0, assists: 0, minutesPlayed: 90, cleanSheet: true },
      ];

      const stats = calculateAthleteStats(games as GameData[]);

      expect(stats.totalGames).toBe(3);
      expect(stats.cleanSheets).toBe(2);
    });

    it('should return zero stats for empty games array', () => {
      const games: GameData[] = [];
      const stats = calculateAthleteStats(games);

      expect(stats.totalGames).toBe(0);
      expect(stats.totalGoals).toBe(0);
      expect(stats.totalAssists).toBe(0);
      expect(stats.totalMinutes).toBe(0);
      expect(stats.cleanSheets).toBe(0);
      expect(stats.averageMinutesPerGame).toBe(0);
      expect(stats.goalsPerGame).toBe(0);
    });
  });

  describe('formatGameDate()', () => {
    it('should format date in short format', () => {
      const date = new Date('2024-10-05T10:00:00Z');
      const formatted = formatGameDate(date, 'short');

      expect(formatted).toMatch(/Oct|October/);
      expect(formatted).toContain('5');
      expect(formatted).toContain('2024');
    });

    it('should format date in long format', () => {
      const date = new Date('2024-10-05T10:00:00Z');
      const formatted = formatGameDate(date, 'long');

      expect(formatted).toContain('October');
      expect(formatted).toContain('5');
      expect(formatted).toContain('2024');
    });
  });

  describe('formatGameDateMobile()', () => {
    it('should format date without year for mobile', () => {
      const date = new Date('2024-10-05T10:00:00Z');
      const formatted = formatGameDateMobile(date);

      expect(formatted).toMatch(/Oct|October/);
      expect(formatted).toContain('5');
      expect(formatted).not.toContain('2024');
    });
  });

  describe('getResultBadgeClasses()', () => {
    it('should return green classes for Win', () => {
      const classes = getResultBadgeClasses('Win');
      expect(classes).toContain('green');
      expect(classes).toContain('text-white');
    });

    it('should return red classes for Loss', () => {
      const classes = getResultBadgeClasses('Loss');
      expect(classes).toContain('red');
      expect(classes).toContain('text-white');
    });

    it('should return zinc classes for Draw', () => {
      const classes = getResultBadgeClasses('Draw');
      expect(classes).toContain('zinc');
      expect(classes).toContain('text-white');
    });

    it('should return fallback classes for unknown result', () => {
      const classes = getResultBadgeClasses('Unknown');
      expect(classes).toContain('zinc');
      expect(classes).toContain('text-white');
    });
  });

  describe('isGoalkeeper()', () => {
    it('should return true for Goalkeeper', () => {
      expect(isGoalkeeper('Goalkeeper')).toBe(true);
    });

    it('should return false for other positions', () => {
      expect(isGoalkeeper('Forward')).toBe(false);
      expect(isGoalkeeper('Midfielder')).toBe(false);
      expect(isGoalkeeper('Defender')).toBe(false);
    });
  });

  describe('isValidGameResult()', () => {
    it('should return true for valid results', () => {
      expect(isValidGameResult('Win')).toBe(true);
      expect(isValidGameResult('Loss')).toBe(true);
      expect(isValidGameResult('Draw')).toBe(true);
    });

    it('should return false for invalid results', () => {
      expect(isValidGameResult('Won')).toBe(false);
      expect(isValidGameResult('Tie')).toBe(false);
      expect(isValidGameResult('')).toBe(false);
    });
  });

  describe('calculateWinPercentage()', () => {
    it('should calculate win percentage correctly', () => {
      const games: Partial<GameData>[] = [
        { result: 'Win' },
        { result: 'Loss' },
        { result: 'Win' },
      ];

      const percentage = calculateWinPercentage(games as GameData[]);
      expect(percentage).toBe(66.67);
    });

    it('should return 0 for empty games array', () => {
      const percentage = calculateWinPercentage([]);
      expect(percentage).toBe(0);
    });

    it('should return 100 for all wins', () => {
      const games: Partial<GameData>[] = [
        { result: 'Win' },
        { result: 'Win' },
        { result: 'Win' },
      ];

      const percentage = calculateWinPercentage(games as GameData[]);
      expect(percentage).toBe(100);
    });

    it('should return 0 for no wins', () => {
      const games: Partial<GameData>[] = [
        { result: 'Loss' },
        { result: 'Draw' },
        { result: 'Loss' },
      ];

      const percentage = calculateWinPercentage(games as GameData[]);
      expect(percentage).toBe(0);
    });
  });

  describe('getMostRecentGame()', () => {
    it('should return first game from sorted array', () => {
      const games: Partial<GameData>[] = [
        { id: '1', date: new Date('2024-10-05') },
        { id: '2', date: new Date('2024-10-01') },
      ];

      const recent = getMostRecentGame(games as GameData[]);
      expect(recent?.id).toBe('1');
    });

    it('should return null for empty array', () => {
      const recent = getMostRecentGame([]);
      expect(recent).toBeNull();
    });
  });

  describe('filterGamesByDateRange()', () => {
    it('should filter games within date range', () => {
      const games: Partial<GameData>[] = [
        { id: '1', date: new Date('2024-10-05') },
        { id: '2', date: new Date('2024-10-15') },
        { id: '3', date: new Date('2024-10-25') },
      ];

      const filtered = filterGamesByDateRange(
        games as GameData[],
        new Date('2024-10-10'),
        new Date('2024-10-20')
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should include boundary dates', () => {
      const games: Partial<GameData>[] = [
        { id: '1', date: new Date('2024-10-01') },
        { id: '2', date: new Date('2024-10-15') },
        { id: '3', date: new Date('2024-10-31') },
      ];

      const filtered = filterGamesByDateRange(
        games as GameData[],
        new Date('2024-10-01'),
        new Date('2024-10-31')
      );

      expect(filtered.length).toBe(3);
    });

    it('should return empty array if no games in range', () => {
      const games: Partial<GameData>[] = [
        { id: '1', date: new Date('2024-09-01') },
        { id: '2', date: new Date('2024-09-15') },
      ];

      const filtered = filterGamesByDateRange(
        games as GameData[],
        new Date('2024-10-01'),
        new Date('2024-10-31')
      );

      expect(filtered.length).toBe(0);
    });
  });
});
