import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // This endpoint will run migrations and seed data
    // Only call this once after deployment

    // Test if tables exist by querying User table
    const userCount = await prisma.user.count()

    // If tables don't exist, create a test user and player
    if (userCount === 0) {
      const testUser = await prisma.user.create({
        data: {
          id: 'test-parent-id-12345', // Test ID (SuperTokens would normally provide this)
          firstName: 'Test',
          lastName: 'Parent',
          email: 'test@hustle.app',
          phone: '+1234567890',
          password: '', // SuperTokens manages passwords
          players: {
            create: {
              name: 'Test Player',
              birthday: new Date('2010-01-15'), // 15 years old
              position: 'Forward',
              teamClub: 'Test FC'
            }
          }
        },
        include: {
          players: true
        }
      })

      return NextResponse.json({
        status: 'ok',
        message: 'Database setup successful',
        data: testUser
      })
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Database already initialized',
      userCount
    })
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Database setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
