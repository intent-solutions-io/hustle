/**
 * E2E Test Mode Detection
 *
 * Single source of truth for checking if the app is running in E2E test mode.
 * Replaces inline `process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true'` checks.
 */

export function isE2ETestMode(): boolean {
  return process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
}
