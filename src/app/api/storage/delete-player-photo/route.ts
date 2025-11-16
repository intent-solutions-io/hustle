/**
 * Delete Player Photo API Route
 *
 * Phase 6 Task 5: Storage & Uploads
 *
 * DELETE /api/storage/delete-player-photo
 *
 * Deletes a player's profile photo and updates storage usage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deletePlayerPhoto, extractStoragePath } from '@/lib/firebase/storage';
import { getPlayer, updatePlayer } from '@/lib/firebase/services/players';
import { updateWorkspaceStorageUsage } from '@/lib/firebase/services/workspaces';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/storage/delete-player-photo');

/**
 * DELETE /api/storage/delete-player-photo
 *
 * Delete player profile photo.
 *
 * Request:
 * - Body: { playerId: string }
 *
 * Response:
 * - 200: { success: true, sizeFreed: number }
 * - 400: Invalid request
 * - 401: Unauthorized
 * - 403: Not owner of player
 * - 404: Player or photo not found
 * - 500: Server error
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse request body
    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json({ error: 'Missing required field: playerId' }, { status: 400 });
    }

    // 3. Get player and verify ownership
    const player = await getPlayer(userId, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 4. Check if player has a photo
    if (!player.photoUrl) {
      return NextResponse.json({ error: 'Player has no photo' }, { status: 404 });
    }

    // 5. Extract storage path from URL
    const storagePath = extractStoragePath(player.photoUrl);
    if (!storagePath) {
      return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 });
    }

    // 6. Delete photo from Firebase Storage
    const sizeFreed = await deletePlayerPhoto(storagePath);

    // 7. Update player photoUrl in Firestore
    await updatePlayer(userId, playerId, {
      photoUrl: null,
    });

    // 8. Update workspace storage usage (negative delta)
    await updateWorkspaceStorageUsage(player.workspaceId, -sizeFreed);

    logger.info('Player photo deleted successfully', {
      userId,
      playerId,
      workspaceId: player.workspaceId,
      storagePath,
      sizeFreed,
    });

    return NextResponse.json({
      success: true,
      sizeFreed,
    });
  } catch (error: any) {
    logger.error('Delete player photo failed', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
