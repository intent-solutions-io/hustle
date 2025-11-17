/**
 * Plan Limits Utility Tests
 *
 * Tests for evaluatePlanLimits, getLimitStateColor, and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  evaluatePlanLimits,
  getLimitStateColor,
  formatLimit,
  getLimitWarningMessage,
  type PlanLimits,
} from '@/lib/billing/plan-limits';
import type { Workspace } from '@/types/firestore';

/**
 * Helper to create a mock workspace
 */
function createMockWorkspace(
  plan: 'free' | 'starter' | 'pro' | 'elite',
  playerCount: number,
  gamesThisMonth: number
): Workspace {
  return {
    id: 'test-workspace',
    ownerUserId: 'test-user',
    name: 'Test Workspace',
    plan,
    status: 'active',
    billing: {
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    },
    members: [],
    usage: {
      playerCount,
      gamesThisMonth,
      storageUsedMB: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

describe('evaluatePlanLimits', () => {
  describe('Free Plan', () => {
    it('should return ok state when under 70% of limits', () => {
      const workspace = createMockWorkspace('free', 0, 3); // 0/1 players, 3/5 games (60%)
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('ok');
      expect(limits.player.limit).toBe(1);
      expect(limits.games.limit).toBe(5);
    });

    it('should return warning state when at 70% of limit', () => {
      const workspace = createMockWorkspace('free', 0, 4); // 4/5 games = 80%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.games.state).toBe('warning');
    });

    it('should return critical state when at or above 100% of limit', () => {
      const workspace = createMockWorkspace('free', 1, 5); // 1/1 players, 5/5 games
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('critical');
      expect(limits.games.state).toBe('critical');
    });

    it('should return critical state when over limit', () => {
      const workspace = createMockWorkspace('free', 2, 6); // 2/1 players, 6/5 games
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('critical');
      expect(limits.games.state).toBe('critical');
    });
  });

  describe('Starter Plan', () => {
    it('should use correct limits (3 players, 20 games)', () => {
      const workspace = createMockWorkspace('starter', 1, 10);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.limit).toBe(3);
      expect(limits.games.limit).toBe(20);
      expect(limits.player.state).toBe('ok'); // 1/3 = 33%
      expect(limits.games.state).toBe('ok'); // 10/20 = 50%
    });

    it('should return warning at 70% threshold', () => {
      const workspace = createMockWorkspace('starter', 3, 14); // 3/3 = 100%, 14/20 = 70%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('critical');
      expect(limits.games.state).toBe('warning');
    });
  });

  describe('Pro Plan', () => {
    it('should use correct limits (10 players, 200 games)', () => {
      const workspace = createMockWorkspace('pro', 5, 100);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.limit).toBe(10);
      expect(limits.games.limit).toBe(200);
      expect(limits.player.state).toBe('ok'); // 5/10 = 50%
      expect(limits.games.state).toBe('ok'); // 100/200 = 50%
    });

    it('should return warning between 70-99%', () => {
      const workspace = createMockWorkspace('pro', 8, 150); // 8/10 = 80%, 150/200 = 75%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('warning');
      expect(limits.games.state).toBe('warning');
    });

    it('should return critical at 100%', () => {
      const workspace = createMockWorkspace('pro', 10, 200);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('critical');
      expect(limits.games.state).toBe('critical');
    });
  });

  describe('Elite Plan', () => {
    it('should return ok state for any usage (infinite limits)', () => {
      const workspace = createMockWorkspace('elite', 999, 9999);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('ok');
      expect(limits.player.limit).toBe(Infinity);
      expect(limits.games.limit).toBe(Infinity);
    });

    it('should return ok even with zero usage', () => {
      const workspace = createMockWorkspace('elite', 0, 0);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('ok');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing usage data', () => {
      const workspace = createMockWorkspace('free', 0, 0);
      workspace.usage = {} as any; // Empty usage object
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.used).toBe(0);
      expect(limits.games.used).toBe(0);
      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('ok');
    });

    it('should handle invalid plan (defaults to free)', () => {
      const workspace = createMockWorkspace('free', 0, 0);
      workspace.plan = 'invalid' as any;
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.limit).toBe(1);
      expect(limits.games.limit).toBe(5);
    });

    it('should handle exact 70% threshold (should be warning)', () => {
      const workspace = createMockWorkspace('pro', 7, 140); // exactly 70%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('warning');
      expect(limits.games.state).toBe('warning');
    });

    it('should handle 69% threshold (should be ok)', () => {
      const workspace = createMockWorkspace('pro', 6, 138); // 60%, 69%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('ok');
      expect(limits.games.state).toBe('ok');
    });

    it('should handle 99% threshold (should be warning)', () => {
      const workspace = createMockWorkspace('pro', 9, 198); // 90%, 99%
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe('warning');
      expect(limits.games.state).toBe('warning');
    });
  });
});

describe('getLimitStateColor', () => {
  it('should return green for ok state', () => {
    expect(getLimitStateColor('ok')).toBe('green');
  });

  it('should return yellow for warning state', () => {
    expect(getLimitStateColor('warning')).toBe('yellow');
  });

  it('should return red for critical state', () => {
    expect(getLimitStateColor('critical')).toBe('red');
  });

  it('should default to green for invalid state', () => {
    expect(getLimitStateColor('invalid' as any)).toBe('green');
  });
});

describe('formatLimit', () => {
  it('should return infinity symbol for Infinity', () => {
    expect(formatLimit(Infinity)).toBe('∞');
  });

  it('should return string number for finite values', () => {
    expect(formatLimit(1)).toBe('1');
    expect(formatLimit(10)).toBe('10');
    expect(formatLimit(200)).toBe('200');
  });

  it('should handle zero', () => {
    expect(formatLimit(0)).toBe('0');
  });
});

describe('getLimitWarningMessage', () => {
  describe('Player Warnings', () => {
    it('should return null for ok state', () => {
      expect(getLimitWarningMessage('player', 'ok')).toBeNull();
    });

    it('should return warning message for warning state', () => {
      const message = getLimitWarningMessage('player', 'warning');
      expect(message).toBe('You are approaching your player limit.');
    });

    it('should return critical message for critical state', () => {
      const message = getLimitWarningMessage('player', 'critical');
      expect(message).toBe('Player limit reached. Upgrade your plan to continue adding athletes.');
    });
  });

  describe('Games Warnings', () => {
    it('should return null for ok state', () => {
      expect(getLimitWarningMessage('games', 'ok')).toBeNull();
    });

    it('should return warning message for warning state', () => {
      const message = getLimitWarningMessage('games', 'warning');
      expect(message).toBe('You are nearing your monthly games limit.');
    });

    it('should return critical message for critical state', () => {
      const message = getLimitWarningMessage('games', 'critical');
      expect(message).toBe('Monthly games limit reached. Upgrade your plan to continue adding games.');
    });
  });
});

describe('State Thresholds (Integration)', () => {
  it('should correctly categorize all plans at key percentages', () => {
    const testCases = [
      { plan: 'free' as const, players: 0, games: 3, expectedPlayer: 'ok', expectedGames: 'ok' }, // 0%, 60%
      { plan: 'free' as const, players: 1, games: 4, expectedPlayer: 'critical', expectedGames: 'warning' }, // 100%, 80%
      { plan: 'starter' as const, players: 2, games: 14, expectedPlayer: 'ok', expectedGames: 'warning' }, // 67%, 70% - Fixed: 67% < 70% = ok
      { plan: 'pro' as const, players: 7, games: 140, expectedPlayer: 'warning', expectedGames: 'warning' }, // 70%, 70%
      { plan: 'pro' as const, players: 10, games: 200, expectedPlayer: 'critical', expectedGames: 'critical' }, // 100%, 100%
      { plan: 'elite' as const, players: 999, games: 9999, expectedPlayer: 'ok', expectedGames: 'ok' }, // Infinity
    ];

    testCases.forEach(({ plan, players, games, expectedPlayer, expectedGames }) => {
      const workspace = createMockWorkspace(plan, players, games);
      const limits = evaluatePlanLimits(workspace);

      expect(limits.player.state).toBe(expectedPlayer);
      expect(limits.games.state).toBe(expectedGames);
    });
  });
});
