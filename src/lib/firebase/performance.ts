/**
 * Firebase Performance Monitoring Utilities
 *
 * Custom trace helpers for instrumenting critical user flows and operations.
 * Provides a simple API for measuring performance of specific code sections.
 *
 * Reference: 000-docs/238-MON-SPEC-hustle-gcp-firebase-observability-baseline.md
 *
 * Usage:
 * ```typescript
 * import { traceAsync, startTrace, stopTrace } from '@/lib/firebase/performance';
 *
 * // Async operation
 * const result = await traceAsync('calculate_player_stats', async () => {
 *   return await calculateStats(playerId);
 * });
 *
 * // Manual start/stop
 * const trace = startTrace('user_login');
 * // ... login logic
 * stopTrace(trace);
 * ```
 */

import { performance as firebasePerformance } from './config';
import type { PerformanceTrace } from 'firebase/performance';

/**
 * Start a custom trace
 *
 * @param traceName - Unique name for the trace (use kebab-case)
 * @returns PerformanceTrace instance or null if Performance Monitoring not initialized
 *
 * @example
 * const trace = startTrace('fetch-player-data');
 * // ... operation
 * stopTrace(trace);
 */
export function startTrace(traceName: string): PerformanceTrace | null {
  if (!firebasePerformance) {
    // Performance Monitoring not available (SSR or not initialized)
    return null;
  }

  try {
    const trace = firebasePerformance.trace(traceName);
    trace.start();
    return trace;
  } catch (error) {
    console.warn(`Failed to start trace "${traceName}":`, error);
    return null;
  }
}

/**
 * Stop a custom trace
 *
 * @param trace - PerformanceTrace instance from startTrace()
 *
 * @example
 * const trace = startTrace('operation-name');
 * // ... operation
 * stopTrace(trace);
 */
export function stopTrace(trace: PerformanceTrace | null): void {
  if (!trace) return;

  try {
    trace.stop();
  } catch (error) {
    console.warn('Failed to stop trace:', error);
  }
}

/**
 * Add custom attribute to trace
 *
 * @param trace - PerformanceTrace instance
 * @param name - Attribute name
 * @param value - Attribute value (string)
 *
 * @example
 * const trace = startTrace('create-game');
 * addTraceAttribute(trace, 'playerId', playerId);
 * addTraceAttribute(trace, 'position', 'Forward');
 */
export function addTraceAttribute(
  trace: PerformanceTrace | null,
  name: string,
  value: string
): void {
  if (!trace) return;

  try {
    trace.putAttribute(name, value);
  } catch (error) {
    console.warn(`Failed to add attribute "${name}" to trace:`, error);
  }
}

/**
 * Add custom metric to trace
 *
 * @param trace - PerformanceTrace instance
 * @param name - Metric name
 * @param value - Metric value (number)
 *
 * @example
 * const trace = startTrace('batch-import');
 * addTraceMetric(trace, 'recordsProcessed', 150);
 * addTraceMetric(trace, 'errorsEncountered', 2);
 */
export function addTraceMetric(
  trace: PerformanceTrace | null,
  name: string,
  value: number
): void {
  if (!trace) return;

  try {
    trace.putMetric(name, value);
  } catch (error) {
    console.warn(`Failed to add metric "${name}" to trace:`, error);
  }
}

/**
 * Increment a metric on a trace
 *
 * @param trace - PerformanceTrace instance
 * @param name - Metric name
 * @param incrementBy - Amount to increment (default: 1)
 *
 * @example
 * const trace = startTrace('process-queue');
 * for (const item of queue) {
 *   // ... process item
 *   incrementTraceMetric(trace, 'itemsProcessed');
 * }
 */
export function incrementTraceMetric(
  trace: PerformanceTrace | null,
  name: string,
  incrementBy: number = 1
): void {
  if (!trace) return;

  try {
    trace.incrementMetric(name, incrementBy);
  } catch (error) {
    console.warn(`Failed to increment metric "${name}" on trace:`, error);
  }
}

/**
 * Wrap an async function with automatic tracing
 *
 * @param traceName - Name for the trace
 * @param fn - Async function to trace
 * @param attributes - Optional attributes to add to trace
 * @returns Result of the async function
 *
 * @example
 * const playerData = await traceAsync('fetch-player-details', async () => {
 *   return await getPlayer(playerId);
 * }, { playerId });
 */
export async function traceAsync<T>(
  traceName: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string>
): Promise<T> {
  const trace = startTrace(traceName);

  // Add attributes if provided
  if (trace && attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      addTraceAttribute(trace, key, value);
    });
  }

  try {
    const result = await fn();
    stopTrace(trace);
    return result;
  } catch (error) {
    // Stop trace even on error
    stopTrace(trace);
    throw error;
  }
}

/**
 * Wrap a synchronous function with automatic tracing
 *
 * @param traceName - Name for the trace
 * @param fn - Synchronous function to trace
 * @param attributes - Optional attributes to add to trace
 * @returns Result of the function
 *
 * @example
 * const stats = traceSync('calculate-stats', () => {
 *   return computeStatistics(data);
 * }, { dataSize: String(data.length) });
 */
export function traceSync<T>(
  traceName: string,
  fn: () => T,
  attributes?: Record<string, string>
): T {
  const trace = startTrace(traceName);

  // Add attributes if provided
  if (trace && attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      addTraceAttribute(trace, key, value);
    });
  }

  try {
    const result = fn();
    stopTrace(trace);
    return result;
  } catch (error) {
    // Stop trace even on error
    stopTrace(trace);
    throw error;
  }
}

/**
 * Create a trace for React component rendering
 *
 * Use in useEffect to measure component mount time
 *
 * @param componentName - Name of the component
 * @returns Cleanup function for useEffect
 *
 * @example
 * useEffect(() => {
 *   return traceComponent('PlayerDashboard');
 * }, []);
 */
export function traceComponent(componentName: string): () => void {
  const trace = startTrace(`component-${componentName}`);

  // Return cleanup function
  return () => {
    stopTrace(trace);
  };
}

/**
 * Critical user flows to trace
 *
 * These are pre-defined trace names for consistency across the application.
 * Use these constants instead of hardcoding strings.
 */
export const TRACE_NAMES = {
  // Authentication flows
  USER_LOGIN: 'user-login',
  USER_REGISTER: 'user-register',
  USER_LOGOUT: 'user-logout',
  EMAIL_VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',

  // Player management
  CREATE_PLAYER: 'create-player',
  UPDATE_PLAYER: 'update-player',
  DELETE_PLAYER: 'delete-player',
  FETCH_PLAYER_LIST: 'fetch-player-list',
  FETCH_PLAYER_DETAILS: 'fetch-player-details',

  // Game logging
  CREATE_GAME: 'create-game',
  UPDATE_GAME: 'update-game',
  DELETE_GAME: 'delete-game',
  FETCH_GAMES: 'fetch-games',
  VERIFY_GAME: 'verify-game',

  // Statistics calculation
  CALCULATE_PLAYER_STATS: 'calculate-player-stats',
  CALCULATE_TEAM_STATS: 'calculate-team-stats',
  GENERATE_REPORT: 'generate-report',

  // Dashboard
  LOAD_DASHBOARD: 'load-dashboard',
  LOAD_ATHLETE_DETAIL: 'load-athlete-detail',

  // API calls
  API_PLAYERS: 'api-players',
  API_GAMES: 'api-games',
  API_STATS: 'api-stats',
} as const;

/**
 * Performance budgets from observability spec
 *
 * Reference: 000-docs/238-MON-SPEC Section 2.1
 */
export const PERFORMANCE_BUDGETS = {
  /**
   * First Contentful Paint (FCP) - When first content is rendered
   * Target: < 1.5s
   */
  FIRST_CONTENTFUL_PAINT: 1500, // ms

  /**
   * Time to Interactive (TTI) - When page becomes fully interactive
   * Target: < 3.5s
   */
  TIME_TO_INTERACTIVE: 3500, // ms

  /**
   * Largest Contentful Paint (LCP) - When largest content is rendered
   * Target: < 2.5s
   */
  LARGEST_CONTENTFUL_PAINT: 2500, // ms

  /**
   * First Input Delay (FID) - Time from user interaction to response
   * Target: < 100ms
   */
  FIRST_INPUT_DELAY: 100, // ms

  /**
   * Cumulative Layout Shift (CLS) - Visual stability score
   * Target: < 0.1
   */
  CUMULATIVE_LAYOUT_SHIFT: 0.1, // unitless

  /**
   * API response time (p95)
   * Target: < 2s
   */
  API_RESPONSE_TIME: 2000, // ms
} as const;

/**
 * Log performance budget violation
 *
 * @param metric - Metric name
 * @param value - Measured value
 * @param budget - Budget threshold
 */
function logBudgetViolation(metric: string, value: number, budget: number): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️ Performance budget violation: ${metric} = ${value}ms (budget: ${budget}ms)`
    );
  }
}

/**
 * Check if metric exceeds performance budget
 *
 * @param metric - Metric name
 * @param value - Measured value
 */
export function checkPerformanceBudget(metric: keyof typeof PERFORMANCE_BUDGETS, value: number): boolean {
  const budget = PERFORMANCE_BUDGETS[metric];
  const exceeds = value > budget;

  if (exceeds) {
    logBudgetViolation(metric, value, budget);
  }

  return exceeds;
}
