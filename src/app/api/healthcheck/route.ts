import { NextResponse } from 'next/server'

/**
 * Health check endpoint
 * GET /api/healthcheck
 * Returns 200 OK if service is running
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Service is running',
    timestamp: new Date().toISOString(),
    database: 'Firestore' // Firebase/Firestore (no health check needed)
  })
}
