import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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
    const { gameId } = body

    if (!gameId) {
      return NextResponse.json({
        error: 'Missing gameId'
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

    // Verify authenticated parent owns this game's player
    if (game.player.parent.id !== session.user.id) {
      return NextResponse.json({
        error: 'Forbidden - Not your player'
      }, { status: 403 })
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
