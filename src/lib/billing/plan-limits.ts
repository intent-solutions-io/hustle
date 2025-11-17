/**
 * Plan Limits Evaluation Utility
 *
 * Evaluates workspace usage against plan limits and determines warning states.
 * Does NOT enforce limits - purely informational for UI display.
 */

import type { Workspace } from '@/types/firestore';

export type LimitState = 'ok' | 'warning' | 'critical';

export interface ResourceLimit {
  used: number;
  limit: number;
  state: LimitState;
}

export interface PlanLimits {
  player: ResourceLimit;
  games: ResourceLimit;
}

/**
 * Plan definitions - matches PLAN_DEFINITIONS in plan-changes.ts
 */
const PLAN_LIMITS = {
  free: {
    players: 1,
    gamesPerMonth: 5,
  },
  starter: {
    players: 3,
    gamesPerMonth: 20,
  },
  pro: {
    players: 10,
    gamesPerMonth: 200,
  },
  elite: {
    players: Infinity,
    gamesPerMonth: Infinity,
  },
} as const;

/**
 * State thresholds
 * - ok: < 70% of limit
 * - warning: 70-99% of limit
 * - critical: >= 100% of limit
 */
const WARNING_THRESHOLD = 0.7;
const CRITICAL_THRESHOLD = 1.0;

/**
 * Determine limit state based on usage percentage
 */
function calculateLimitState(used: number, limit: number): LimitState {
  // Elite plan (infinite limits) always OK
  if (limit === Infinity) {
    return 'ok';
  }

  // Avoid division by zero
  if (limit === 0) {
    return used > 0 ? 'critical' : 'ok';
  }

  const percentage = used / limit;

  if (percentage >= CRITICAL_THRESHOLD) {
    return 'critical';
  } else if (percentage >= WARNING_THRESHOLD) {
    return 'warning';
  } else {
    return 'ok';
  }
}

/**
 * Evaluate workspace usage against plan limits
 *
 * @param workspace - Workspace object with plan and usage data
 * @returns Plan limits evaluation with state indicators
 */
export function evaluatePlanLimits(workspace: Workspace): PlanLimits {
  const plan = workspace.plan || 'free';
  const planConfig = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

  const playerUsage = workspace.usage?.playerCount || 0;
  const gamesUsage = workspace.usage?.gamesThisMonth || 0;

  return {
    player: {
      used: playerUsage,
      limit: planConfig.players,
      state: calculateLimitState(playerUsage, planConfig.players),
    },
    games: {
      used: gamesUsage,
      limit: planConfig.gamesPerMonth,
      state: calculateLimitState(gamesUsage, planConfig.gamesPerMonth),
    },
  };
}

/**
 * Map limit state to color for UI display
 */
export function getLimitStateColor(state: LimitState): 'green' | 'yellow' | 'red' {
  switch (state) {
    case 'ok':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'critical':
      return 'red';
    default:
      return 'green';
  }
}

/**
 * Format limit value for display (handles Infinity)
 */
export function formatLimit(limit: number): string {
  return limit === Infinity ? '∞' : limit.toString();
}

/**
 * Get user-friendly warning message for limit state
 */
export function getLimitWarningMessage(
  resourceType: 'player' | 'games',
  state: LimitState
): string | null {
  if (state === 'ok') {
    return null;
  }

  if (resourceType === 'player') {
    return state === 'warning'
      ? 'You are approaching your player limit.'
      : 'Player limit reached. Upgrade your plan to continue adding athletes.';
  } else {
    return state === 'warning'
      ? 'You are nearing your monthly games limit.'
      : 'Monthly games limit reached. Upgrade your plan to continue adding games.';
  }
}
