import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcrypt'

// POST /api/verify - Verify a game log
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json()
    const { gameId, pin } = body

    if (!gameId) {
      return NextResponse.json({
        error: 'Missing gameId'
      }, { status: 400 })
    }

    if (!pin) {
      return NextResponse.json({
        error: 'Missing verification PIN'
      }, { status: 400 })
    }

    // Get game with parent info
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        player: {
          include: {
            parent: {
              select: {
                id: true
              }
            }
          }
        }
      }
    })

    if (!game) {
      return NextResponse.json({
        error: 'Game not found'
      }, { status: 404 })
    }

    // Check if already verified
    if (game.verified) {
      return NextResponse.json({
        error: 'Game already verified'
      }, { status: 400 })
    }

    // Prevent verification if older than 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    if (game.date < fourteenDaysAgo) {
      return NextResponse.json({
        error: 'Games older than 14 days cannot be verified'
      }, { status: 400 })
    }

    // Verify authenticated parent owns this game's player
    if (game.player.parent.id !== session.user.id) {
      return NextResponse.json({
        error: 'Forbidden - Not your player'
      }, { status: 403 })
    }

    // Verify PIN matches user's verification PIN
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verificationPinHash: true }
    });

    if (!user?.verificationPinHash) {
      return NextResponse.json({
        error: 'Verification PIN not set. Please set up your PIN in settings.'
      }, { status: 400 })
    }

    const isValidPin = await bcrypt.compare(pin, user.verificationPinHash)

    if (!isValidPin) {
      return NextResponse.json({
        error: 'Invalid verification PIN'
      }, { status: 401 })
    }

    // Update game to verified
    const verifiedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        verified: true,
        verifiedAt: new Date()
      },
      include: {
        player: {
          select: {
            name: true,
            position: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Game verified successfully',
      game: verifiedGame
    })
  } catch (error) {
    console.error('Error verifying game:', error)
    return NextResponse.json({
      error: 'Failed to verify game'
    }, { status: 500 })
  }
}
