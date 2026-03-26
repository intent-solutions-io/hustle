/**
 * Standardized Event Logging
 *
 * Phase 6 Task 4: Monitoring & Alerting
 *
 * Provides consistent event logging for key application events.
 * All events use standardized field names for easy querying and alerting.
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('events');

/**
 * Standard event fields for all logged events
 */
interface BaseEventFields {
  event: string;
  timestamp: string;
  userId?: string;
  workspaceId?: string;
  [key: string]: unknown;
}

/**
 * Authentication Events
 */
export const authEvents = {
  /**
   * Log successful login
   */
  login: (userId: string, email: string, method: 'email' | 'google' | 'github') => {
    logger.info('User logged in', {
      event: 'auth_login',
      timestamp: new Date().toISOString(),
      userId,
      email,
      method,
    });
  },

  /**
   * Log successful registration
   */
  register: (userId: string, email: string, method: 'email' | 'google' | 'github') => {
    logger.info('User registered', {
      event: 'auth_register',
      timestamp: new Date().toISOString(),
      userId,
      email,
      method,
    });
  },

  /**
   * Log logout
   */
  logout: (userId: string) => {
    logger.info('User logged out', {
      event: 'auth_logout',
      timestamp: new Date().toISOString(),
      userId,
    });
  },

  /**
   * Log failed login attempt
   */
  loginFailed: (email: string, reason: string) => {
    logger.warn('Login attempt failed', {
      event: 'auth_login_failed',
      timestamp: new Date().toISOString(),
      email,
      reason,
    });
  },
};

/**
 * Player Events
 */
export const playerEvents = {
  /**
   * Log player creation
   */
  create: (userId: string, workspaceId: string, playerId: string, playerName: string) => {
    logger.info('Player created', {
      event: 'player_create',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      playerId,
      playerName,
    });
  },

  /**
   * Log player update
   */
  update: (userId: string, workspaceId: string, playerId: string, fields: string[]) => {
    logger.info('Player updated', {
      event: 'player_update',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      playerId,
      fieldsUpdated: fields,
    });
  },

  /**
   * Log player deletion
   */
  delete: (userId: string, workspaceId: string, playerId: string) => {
    logger.info('Player deleted', {
      event: 'player_delete',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      playerId,
    });
  },
};

/**
 * Game Events
 */
export const gameEvents = {
  /**
   * Log game creation
   */
  create: (userId: string, workspaceId: string, playerId: string, gameId: string, opponent: string) => {
    logger.info('Game created', {
      event: 'game_create',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      playerId,
      gameId,
      opponent,
    });
  },

  /**
   * Log game verification
   */
  verify: (userId: string, workspaceId: string, playerId: string, gameId: string) => {
    logger.info('Game verified', {
      event: 'game_verify',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      playerId,
      gameId,
    });
  },

  /**
   * Log game deletion
   */
  delete: (userId: string, workspaceId: string, playerId: string, gameId: string) => {
    logger.info('Game deleted', {
      event: 'game_delete',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      playerId,
      gameId,
    });
  },
};

/**
 * Plan Limit Events
 */
export const planLimitEvents = {
  /**
   * Log plan limit exceeded
   */
  exceeded: (
    userId: string,
    workspaceId: string,
    limitType: 'maxPlayers' | 'maxGamesPerMonth' | 'storageMB',
    currentCount: number,
    limit: number,
    plan: string
  ) => {
    logger.warn('Plan limit exceeded', {
      event: 'plan_limit_hit',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      limitType,
      currentCount,
      limit,
      plan,
    });
  },

  /**
   * Log approaching plan limit (80% threshold)
   */
  approaching: (
    userId: string,
    workspaceId: string,
    limitType: 'maxPlayers' | 'maxGamesPerMonth' | 'storageMB',
    currentCount: number,
    limit: number,
    plan: string,
    percentageUsed: number
  ) => {
    logger.info('Approaching plan limit', {
      event: 'plan_limit_approaching',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      limitType,
      currentCount,
      limit,
      plan,
      percentageUsed,
    });
  },
};

/**
 * Billing Events
 */
export const billingEvents = {
  /**
   * Log Stripe webhook received
   */
  webhookReceived: (eventType: string, eventId: string, customerId?: string) => {
    logger.info('Stripe webhook received', {
      event: 'billing_webhook',
      timestamp: new Date().toISOString(),
      eventType,
      eventId,
      customerId,
    });
  },

  /**
   * Log subscription created
   */
  subscriptionCreated: (
    userId: string,
    workspaceId: string,
    plan: string,
    subscriptionId: string,
    amount: number
  ) => {
    logger.info('Subscription created', {
      event: 'billing_subscription_created',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      plan,
      subscriptionId,
      amount,
    });
  },

  /**
   * Log subscription updated
   */
  subscriptionUpdated: (
    userId: string,
    workspaceId: string,
    oldPlan: string,
    newPlan: string,
    subscriptionId: string
  ) => {
    logger.info('Subscription updated', {
      event: 'billing_subscription_updated',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      oldPlan,
      newPlan,
      subscriptionId,
    });
  },

  /**
   * Log subscription canceled
   */
  subscriptionCanceled: (
    userId: string,
    workspaceId: string,
    plan: string,
    subscriptionId: string,
    reason?: string
  ) => {
    logger.warn('Subscription canceled', {
      event: 'billing_subscription_canceled',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      plan,
      subscriptionId,
      reason,
    });
  },

  /**
   * Log payment failed
   */
  paymentFailed: (
    userId: string,
    workspaceId: string,
    plan: string,
    amount: number,
    invoiceId: string,
    reason?: string
  ) => {
    logger.error('Payment failed', undefined, {
      event: 'billing_payment_failed',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      plan,
      amount,
      invoiceId,
      reason,
    });
  },

  /**
   * Log payment succeeded
   */
  paymentSucceeded: (
    userId: string,
    workspaceId: string,
    plan: string,
    amount: number,
    invoiceId: string
  ) => {
    logger.info('Payment succeeded', {
      event: 'billing_payment_succeeded',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      plan,
      amount,
      invoiceId,
    });
  },
};

/**
 * Workspace Events
 */
export const workspaceEvents = {
  /**
   * Log workspace created
   */
  create: (userId: string, workspaceId: string, plan: string) => {
    logger.info('Workspace created', {
      event: 'workspace_create',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      plan,
    });
  },

  /**
   * Log workspace status changed
   */
  statusChanged: (
    userId: string,
    workspaceId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string
  ) => {
    logger.info('Workspace status changed', {
      event: 'workspace_status_changed',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      oldStatus,
      newStatus,
      reason,
    });
  },

  /**
   * Log workspace deleted
   */
  delete: (userId: string, workspaceId: string, reason?: string) => {
    logger.warn('Workspace deleted', {
      event: 'workspace_delete',
      timestamp: new Date().toISOString(),
      userId,
      workspaceId,
      reason,
    });
  },
};

/**
 * Error Events
 */
export const errorEvents = {
  /**
   * Log API error
   */
  apiError: (
    path: string,
    method: string,
    statusCode: number,
    errorMessage: string,
    userId?: string,
    workspaceId?: string
  ) => {
    logger.error('API error', undefined, {
      event: 'api_error',
      timestamp: new Date().toISOString(),
      path,
      method,
      statusCode,
      errorMessage,
      userId,
      workspaceId,
    });
  },

  /**
   * Log unhandled exception
   */
  unhandledException: (error: Error, context?: Record<string, unknown>) => {
    logger.critical('Unhandled exception', error, {
      event: 'unhandled_exception',
      timestamp: new Date().toISOString(),
      ...context,
    });
  },
};

/**
 * Performance Events
 */
export const performanceEvents = {
  /**
   * Log slow query
   */
  slowQuery: (
    collection: string,
    queryType: string,
    duration: number,
    threshold: number,
    userId?: string,
    workspaceId?: string
  ) => {
    logger.warn('Slow query detected', {
      event: 'performance_slow_query',
      timestamp: new Date().toISOString(),
      collection,
      queryType,
      duration,
      threshold,
      userId,
      workspaceId,
    });
  },

  /**
   * Log slow API response
   */
  slowApiResponse: (
    path: string,
    method: string,
    duration: number,
    threshold: number,
    userId?: string
  ) => {
    logger.warn('Slow API response', {
      event: 'performance_slow_api',
      timestamp: new Date().toISOString(),
      path,
      method,
      duration,
      threshold,
      userId,
    });
  },
};
