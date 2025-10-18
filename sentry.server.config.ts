/**
 * Sentry Server-Side Configuration
 * Captures errors in Next.js API routes and server components
 */
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || 'development';

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment
  environment: SENTRY_ENVIRONMENT,

  // Release tracking
  release: process.env.APP_VERSION || '1.0.0',

  // Performance Monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  integrations: [
    Sentry.prismaIntegration(), // Track Prisma database queries
  ],

  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-api-key'];
    }

    // Remove sensitive query parameters
    if (event.request?.query_string) {
      const sanitized = event.request.query_string
        .replace(/token=[^&]*/g, 'token=REDACTED')
        .replace(/password=[^&]*/g, 'password=REDACTED')
        .replace(/api_key=[^&]*/g, 'api_key=REDACTED');
      event.request.query_string = sanitized;
    }

    return event;
  },

  // Debug mode (only in development)
  debug: SENTRY_ENVIRONMENT === 'development',
});
