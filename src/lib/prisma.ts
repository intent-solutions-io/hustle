/**
 * Prisma stub — the v2.0 codebase uses Firebase/Firestore, not Prisma.
 * This stub keeps legacy API routes from the pre-v2.0 merge from breaking
 * the build. Those routes will return errors at runtime.
 */
import 'server-only';

function notAvailable() {
  throw new Error('prisma is not available in v2.0 — use Firestore instead');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop === 'string') {
      return new Proxy({}, {
        get() { return notAvailable; },
      });
    }
    return notAvailable;
  },
});
