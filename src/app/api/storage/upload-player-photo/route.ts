/**
 * Upload Player Photo API Route
 *
 * Phase 6 Task 5: Storage & Uploads
 *
 * POST /api/storage/upload-player-photo
 *
 * Handles player profile photo uploads with plan-based size limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  uploadPlayerPhoto,
  validateFile,
  deletePlayerPhoto,
  extractStoragePath,
} from '@/lib/firebase/storage';
import { getPlayer, updatePlayer } from '@/lib/firebase/services/players';
import { getWorkspace, updateWorkspaceStorageUsage } from '@/lib/firebase/services/workspaces';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/storage/upload-player-photo');

/**
 * POST /api/storage/upload-player-photo
 *
 * Upload player profile photo with plan-based size limits.
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body: FormData with fields:
 *   - file: File (required)
 *   - playerId: string (required)
 *
 * Response:
 * - 200: { url: string, size: number }
 * - 400: Invalid request or file validation failed
 * - 401: Unauthorized
 * - 403: Not owner of player or workspace inactive
 * - 404: Player not found
 * - 413: File too large or storage quota exceeded
 * - 500: Server error
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', file);
 * formData.append('playerId', 'abc123');
 *
 * const response = await fetch('/api/storage/upload-player-photo', {
 *   method: 'POST',
 *   body: formData,
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const playerId = formData.get('playerId') as string | null;

    if (!file || !playerId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, playerId' },
        { status: 400 }
      );
    }

    // 3. Get player and verify ownership
    const player = await getPlayer(userId, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 4. Get workspace and check status
    if (!player.workspaceId) {
      return NextResponse.json({ error: 'Player has no workspace assigned' }, { status: 400 });
    }
    const workspace = await getWorkspace(player.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // 5. Verify workspace is active or trial
    if (!['active', 'trial'].includes(workspace.status)) {
      return NextResponse.json(
        {
          error: 'Workspace is not active',
          code: 'WORKSPACE_INACTIVE',
          status: workspace.status,
        },
        { status: 403 }
      );
    }

    // 6. Validate file (type, size, quota)
    const validation = validateFile(file, workspace.plan, workspace.usage.storageUsedMB);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 413 } // Payload Too Large
      );
    }

    // 7. Delete old photo if exists
    let oldPhotoSizeMB = 0;
    if (player.photoUrl) {
      const oldPath = extractStoragePath(player.photoUrl);
      if (oldPath) {
        try {
          oldPhotoSizeMB = await deletePlayerPhoto(oldPath);
          logger.info('Replaced old player photo', {
            userId,
            playerId,
            oldPath,
            oldSize: oldPhotoSizeMB,
          });
        } catch (error) {
          // Log but don't fail - old photo might already be deleted
          logger.warn('Failed to delete old player photo', {
            userId,
            playerId,
            oldPath,
            error,
          });
        }
      }
    }

    // 8. Upload new photo
    const uploadResult = await uploadPlayerPhoto(file, userId, playerId);

    // 9. Update player photoUrl in Firestore
    await updatePlayer(userId, playerId, {
      photoUrl: uploadResult.url,
    });

    // 10. Update workspace storage usage
    const netStorageChange = uploadResult.size - oldPhotoSizeMB;
    await updateWorkspaceStorageUsage(workspace.id, netStorageChange);

    logger.info('Player photo uploaded successfully', {
      userId,
      playerId,
      workspaceId: workspace.id,
      url: uploadResult.url,
      size: uploadResult.size,
      netStorageChange,
    });

    return NextResponse.json({
      url: uploadResult.url,
      size: uploadResult.size,
    });
  } catch (error: any) {
    logger.error('Upload player photo failed', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
