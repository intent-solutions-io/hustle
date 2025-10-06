import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Hello World from Hustle MVP!',
    status: 'success',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  })
}
