/**
 * Sentry Edge Runtime Configuration
 * Captures errors in Edge functions and middleware
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

  // Debug mode (only in development)
  debug: SENTRY_ENVIRONMENT === 'development',
});
