/**
 * Firebase Storage Service
 *
 * Phase 6 Task 5: Storage & Uploads
 *
 * Manages file uploads to Firebase Storage with plan-based limits.
 * Handles player profile photos with size validation and quota tracking.
 */

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from 'firebase/storage';
import { app } from './config';
import { createLogger } from '@/lib/logger';

export {
  STORAGE_LIMITS,
  ALLOWED_IMAGE_TYPES,
  validateFile,
  extractStoragePath,
  getRemainingStorage,
  getStorageUsagePercentage,
} from './storage-utils';
export type { ValidationResult } from './storage-utils';

const logger = createLogger('firebase/storage');
const storage = getStorage(app);

/**
 * Upload Result
 */
export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

/**
 * Upload player profile photo
 *
 * @param file - File to upload
 * @param userId - User ID (owner of player)
 * @param playerId - Player ID
 * @returns Upload result with URL and metadata
 */
export async function uploadPlayerPhoto(
  file: File,
  userId: string,
  playerId: string
): Promise<UploadResult> {
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const filename = `player-${playerId}-${timestamp}.${fileExtension}`;

  // Storage path: /users/{userId}/players/{playerId}/photos/{filename}
  const storagePath = `users/${userId}/players/${playerId}/photos/${filename}`;
  const storageRef = ref(storage, storagePath);

  try {
    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        userId,
        playerId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get download URL
    const url = await getDownloadURL(snapshot.ref);

    const fileSizeMB = file.size / (1024 * 1024);

    logger.info('Player photo uploaded', {
      userId,
      playerId,
      path: storagePath,
      size: fileSizeMB,
      url,
    });

    return {
      url,
      path: storagePath,
      size: fileSizeMB,
    };
  } catch (error: any) {
    logger.error('Player photo upload failed', error, {
      userId,
      playerId,
      path: storagePath,
    });
    throw new Error(`Failed to upload photo: ${error.message}`);
  }
}

/**
 * Delete player photo
 *
 * @param storagePath - Full storage path to delete
 * @returns File size in MB (for storage quota update)
 */
export async function deletePlayerPhoto(storagePath: string): Promise<number> {
  const storageRef = ref(storage, storagePath);

  try {
    // Get file metadata before deleting
    const metadata = await getMetadata(storageRef);
    const fileSizeMB = metadata.size / (1024 * 1024);

    // Delete file
    await deleteObject(storageRef);

    logger.info('Player photo deleted', {
      path: storagePath,
      size: fileSizeMB,
    });

    return fileSizeMB;
  } catch (error: any) {
    logger.error('Player photo deletion failed', error, {
      path: storagePath,
    });
    throw new Error(`Failed to delete photo: ${error.message}`);
  }
}
