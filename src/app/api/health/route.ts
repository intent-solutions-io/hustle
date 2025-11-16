/**
 * Health Check Endpoint
 *
 * Returns application health status, version, and environment.
 * Used by CI/CD pipelines, load balancers, and monitoring systems.
 *
 * Phase 5 Task 5: Go-Live Guardrails
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET() {
  const startTime = Date.now();

  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      service: 'hustle-api',
    };

    // Optional: Ping Firestore to verify database connectivity
    // Only run in production to avoid unnecessary reads in dev
    if (process.env.NODE_ENV === 'production') {
      try {
        // Simple ping: check if we can read from Firestore
        await db.collection('_health').doc('ping').get();

        const duration = Date.now() - startTime;

        return NextResponse.json({
          ...health,
          firestore: {
            status: 'connected',
            latencyMs: duration,
          },
        });
      } catch (firestoreError) {
        // Firestore connection failed
        return NextResponse.json(
          {
            ...health,
            status: 'degraded',
            firestore: {
              status: 'disconnected',
              error: firestoreError instanceof Error ? firestoreError.message : 'Unknown error',
            },
          },
          { status: 503 } // Service Unavailable
        );
      }
    }

    // Development/staging: skip Firestore ping
    const duration = Date.now() - startTime;

    return NextResponse.json({
      ...health,
      firestore: {
        status: 'skipped',
        reason: 'Firestore ping disabled in non-production environments',
      },
      latencyMs: duration,
    });
  } catch (error) {
    // Unexpected error
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
