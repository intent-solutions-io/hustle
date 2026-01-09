/**
 * Health Check Endpoint
 *
 * Returns application health status, version, and environment.
 * Used by CI/CD pipelines, load balancers, and monitoring systems.
 *
 * Phase 5 Task 5: Go-Live Guardrails (basic version)
 * Phase 6 Task 4: Enhanced monitoring & alerting
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/health');

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  service: string;
  checks: {
    firestore: {
      status: 'pass' | 'fail' | 'skipped';
      responseTime?: number;
      error?: string;
      reason?: string;
    };
    environment: {
      status: 'pass' | 'fail';
      missing?: string[];
    };
  };
  latencyMs: number;
}

/**
 * GET /api/health
 *
 * Comprehensive health check with multiple validation points.
 *
 * Response codes:
 * - 200: All checks pass (healthy)
 * - 200: Some non-critical checks fail (degraded)
 * - 503: Critical checks fail (unhealthy)
 *
 * Cloud Monitoring Alert Condition:
 * - Alert if status !== 'healthy' for 2 consecutive checks (2 minutes)
 *
 * @example
 * ```bash
 * curl https://hustleapp-production.web.app/api/health
 * ```
 */
export async function GET() {
  const startTime = Date.now();

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    service: 'hustle-api',
    checks: {
      firestore: {
        status: 'pass',
      },
      environment: {
        status: 'pass',
      },
    },
    latencyMs: 0,
  };

  // Check 1: Firestore connectivity (production only)
  if (process.env.NODE_ENV === 'production') {
    try {
      const firestoreStart = Date.now();

      // Attempt to read health check document
      await adminDb.collection('_health').doc('ping').get();

      const firestoreResponseTime = Date.now() - firestoreStart;

      result.checks.firestore = {
        status: 'pass',
        responseTime: firestoreResponseTime,
      };

      // Warn if Firestore is slow (>1s is concerning)
      if (firestoreResponseTime > 1000) {
        result.status = 'degraded';
        logger.warn('Firestore health check slow', {
          responseTime: firestoreResponseTime,
          threshold: 1000,
        });
      }
    } catch (error: any) {
      result.checks.firestore = {
        status: 'fail',
        error: error.message || 'Unknown error',
      };
      result.status = 'unhealthy';

      logger.error('Firestore health check failed', error);
    }
  } else {
    // Skip Firestore check in non-production
    result.checks.firestore = {
      status: 'skipped',
      reason: 'Firestore ping disabled in non-production environments',
    };
  }

  // Check 2: Required environment variables
  // Firebase auth: either FIREBASE_SERVICE_ACCOUNT_JSON or (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
  const hasFirebaseAuth =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'RESEND_API_KEY',
    'EMAIL_FROM',
  ];

  // Only check Stripe if billing is enabled
  if (process.env.BILLING_ENABLED !== 'false') {
    requiredEnvVars.push('STRIPE_SECRET_KEY');
  }

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  // Add Firebase auth check
  if (!hasFirebaseAuth) {
    missingEnvVars.push('FIREBASE_SERVICE_ACCOUNT_JSON or (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)');
  }

  if (missingEnvVars.length > 0) {
    result.checks.environment = {
      status: 'fail',
      missing: missingEnvVars,
    };
    result.status = 'unhealthy';

    logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  // Calculate total latency
  result.latencyMs = Date.now() - startTime;

  // Determine HTTP status code
  const httpStatus = result.status === 'unhealthy' ? 503 : 200;

  // Structured logging for monitoring
  logger.info('Health check completed', {
    event: 'health_check',
    status: result.status,
    duration: result.latencyMs,
    firestoreStatus: result.checks.firestore.status,
    firestoreResponseTime: result.checks.firestore.responseTime,
    environmentStatus: result.checks.environment.status,
    timestamp: result.timestamp,
  });

  return NextResponse.json(result, { status: httpStatus });
}
