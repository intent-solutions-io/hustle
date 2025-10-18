/**
 * Sentry Client-Side Configuration
 * Captures errors in the browser
 */
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: SENTRY_ENVIRONMENT,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Performance Monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Session Replay (user behavior recording)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out known non-issues
  ignoreErrors: [
    // Browser extensions
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    // Auth errors (handled gracefully)
    'Invalid credentials',
    'Unauthorized',
  ],

  // Add context to errors
  beforeSend(event) {
    // Filter out localhost errors in development
    if (SENTRY_ENVIRONMENT === 'development' && typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost') {
        return null;
      }
    }

    // Add user context if available
    if (typeof window !== 'undefined') {
      interface NextWindow extends Window {
        __NEXT_DATA__?: {
          props?: {
            pageProps?: {
              session?: {
                user?: {
                  id?: string;
                  email?: string;
                };
              };
            };
          };
        };
      }

      const nextWindow = window as unknown as NextWindow;
      const session = nextWindow.__NEXT_DATA__?.props?.pageProps?.session;

      if (session?.user) {
        event.user = {
          id: session.user.id,
          email: session.user.email,
        };
      }
    }

    return event;
  },

  // Debug mode (only in development)
  debug: SENTRY_ENVIRONMENT === 'development',
});
