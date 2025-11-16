import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import bcrypt from 'bcrypt'
import { getUser } from '@/lib/firebase/services/users'
import { getGame, verifyGame } from '@/lib/firebase/services/games'
import { getPlayer } from '@/lib/firebase/services/players'

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
    const { gameId, playerId, pin } = body

    if (!gameId) {
      return NextResponse.json({
        error: 'Missing gameId'
      }, { status: 400 })
    }

    if (!playerId) {
      return NextResponse.json({
        error: 'Missing playerId'
      }, { status: 400 })
    }

    if (!pin) {
      return NextResponse.json({
        error: 'Missing verification PIN'
      }, { status: 400 })
    }

    // Get game from Firestore (requires userId and playerId for subcollection path)
    const game = await getGame(session.user.id, playerId, gameId);

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

    // Verify player exists and belongs to authenticated user (implicit in Firestore path)
    const player = await getPlayer(session.user.id, playerId);

    if (!player) {
      return NextResponse.json({
        error: 'Forbidden - Not your player'
      }, { status: 403 })
    }

    // Verify PIN matches user's verification PIN (Firestore)
    const user = await getUser(session.user.id);

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

    // Update game to verified (Firestore)
    await verifyGame(session.user.id, playerId, gameId);

    // Get updated game for response
    const verifiedGame = await getGame(session.user.id, playerId, gameId);

    // Format response to match Prisma structure
    const gameWithPlayer = {
      ...verifiedGame,
      player: {
        name: player.name,
        position: player.position
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Game verified successfully',
      game: gameWithPlayer
    })
  } catch (error) {
    console.error('Error verifying game:', error)
    return NextResponse.json({
      error: 'Failed to verify game'
    }, { status: 500 })
  }
}
