import { NextRequest, NextResponse } from 'next/server'

/**
 * Health check endpoint
 * GET /api/healthcheck - Basic health check
 * POST /api/healthcheck - Verifies POST requests work (critical for login/auth)
 *
 * The POST endpoint is used by CI/CD to verify deployments are fully functional.
 * If POST requests don't work, login and other critical features will fail.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Service is running',
    timestamp: new Date().toISOString(),
    methods: ['GET', 'POST'],
    database: 'Firestore'
  })
}

export async function POST(request: NextRequest) {
  // This endpoint verifies POST requests work correctly
  // Used by deployment verification to catch POST timeout issues
  const timestamp = new Date().toISOString();

  // Try to read body (optional) to verify body parsing works
  let bodyReceived = false;
  try {
    const body = await request.json().catch(() => null);
    bodyReceived = body !== null;
  } catch {
    // Body parsing is optional for health check
  }

  return NextResponse.json({
    status: 'ok',
    message: 'POST requests working',
    timestamp,
    bodyReceived,
    method: 'POST'
  })
}
