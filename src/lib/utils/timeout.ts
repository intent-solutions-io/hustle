/**
 * Shared Timeout Utility
 *
 * Wraps a promise with a timeout. Clears the timer on resolution
 * to prevent stale log spam.
 */

export function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.then((result) => { if (timeoutId) clearTimeout(timeoutId); return result; }),
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${operation} timed out after ${ms}ms`));
      }, ms);
    }),
  ]);
}
