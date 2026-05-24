/**
 * Health Check Endpoint
 *
 * Returns application health status, version, and environment.
 * Used by CI/CD pipelines, load balancers, and monitoring systems.
 *
 * Phase 4.5 migration: Firestore ping replaced with a Drizzle/SQLite
 * `select 1` round-trip. Critical env vars list dropped FIREBASE_* in
 * favour of DATABASE_PATH (effectively optional with a default).
 */

import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { createLogger } from '@/lib/logger';
import { withTimeout } from '@/lib/utils/timeout';

const logger = createLogger('api/health');

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  service: string;
  checks: {
    database: {
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

export async function GET() {
  const startTime = Date.now();

  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    service: 'hustle-api',
    checks: {
      database: {
        status: 'pass',
      },
      environment: {
        status: 'pass',
      },
    },
    latencyMs: 0,
  };

  // Check 1: SQLite database connectivity (production only)
  if (process.env.NODE_ENV === 'production') {
    try {
      const dbStart = Date.now();
      await withTimeout(
        Promise.resolve(db.run(sql`select 1`)),
        5000,
        'Database health ping'
      );
      const dbResponseTime = Date.now() - dbStart;

      result.checks.database = {
        status: 'pass',
        responseTime: dbResponseTime,
      };

      if (dbResponseTime > 1000) {
        result.status = 'degraded';
        logger.warn('Database health check slow', {
          responseTime: dbResponseTime,
          threshold: 1000,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      result.checks.database = {
        status: 'fail',
        error: msg,
      };
      result.status = 'unhealthy';
      logger.error(
        'Database health check failed',
        error instanceof Error ? error : new Error(msg)
      );
    }
  } else {
    result.checks.database = {
      status: 'skipped',
      reason: 'Database ping disabled in non-production environments',
    };
  }

  // Check 2: Required environment variables
  // Critical env vars — app won't function without these.
  const criticalEnvVars: string[] = [];

  if (process.env.BILLING_ENABLED !== 'false') {
    criticalEnvVars.push('STRIPE_SECRET_KEY');
  }

  // Optional env vars — app can function without these (degraded mode).
  const optionalEnvVars = ['RESEND_API_KEY', 'EMAIL_FROM'];

  const missingCritical = criticalEnvVars.filter((envVar) => !process.env[envVar]);
  const missingOptional = optionalEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingCritical.length > 0) {
    result.checks.environment = {
      status: 'fail',
      missing: missingCritical,
    };
    result.status = 'unhealthy';
    logger.error(`Missing critical environment variables: ${missingCritical.join(', ')}`);
  } else if (missingOptional.length > 0) {
    result.checks.environment = {
      status: 'pass',
    };
    logger.warn(
      `Missing optional environment variables (email disabled): ${missingOptional.join(', ')}`
    );
  }

  result.latencyMs = Date.now() - startTime;

  const httpStatus = result.status === 'unhealthy' ? 503 : 200;

  logger.info('Health check completed', {
    event: 'health_check',
    status: result.status,
    duration: result.latencyMs,
    databaseStatus: result.checks.database.status,
    databaseResponseTime: result.checks.database.responseTime,
    environmentStatus: result.checks.environment.status,
    timestamp: result.timestamp,
  });

  return NextResponse.json(result, { status: httpStatus });
}
