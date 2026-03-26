import { NextRequest, NextResponse } from 'next/server';

// Ultra-minimal POST endpoint for testing - logs immediately on entry
export async function GET() {
  console.log('[test-post] GET handler reached at', new Date().toISOString());
  return NextResponse.json({ method: 'GET', ok: true, time: Date.now() });
}

export async function POST(request: NextRequest) {
  // Log IMMEDIATELY before any other operation
  console.log('[test-post] POST handler reached at', new Date().toISOString());
  console.log('[test-post] Request method:', request.method);

  // Return immediately without reading body or any async operations
  return NextResponse.json({
    method: 'POST',
    ok: true,
    time: Date.now(),
    message: 'POST endpoint working'
  });
}
