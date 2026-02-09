import { NextRequest, NextResponse } from 'next/server';

// Minimal POST endpoint for testing
export async function GET() {
  return NextResponse.json({ method: 'GET', ok: true, time: Date.now() });
}

export async function POST(request: NextRequest) {
  // Return immediately without any async operations
  return NextResponse.json({ method: 'POST', ok: true, time: Date.now() });
}
