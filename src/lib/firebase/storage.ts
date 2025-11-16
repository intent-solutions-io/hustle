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
import type { WorkspacePlan } from '@/types/firestore';

const logger = createLogger('firebase/storage');
const storage = getStorage(app);

/**
 * Storage Limits by Plan
 *
 * Controls maximum file upload size and total workspace storage.
 */
export const STORAGE_LIMITS: Record<
  WorkspacePlan,
  {
    maxFileSize: number;      // Max single file size in MB
    totalStorage: number;     // Total storage quota in MB
  }
> = {
  free: {
    maxFileSize: 2,    // 2 MB per file
    totalStorage: 50,  // 50 MB total
  },
  starter: {
    maxFileSize: 5,    // 5 MB per file
    totalStorage: 500, // 500 MB total
  },
  plus: {
    maxFileSize: 10,   // 10 MB per file
    totalStorage: 2000, // 2 GB total
  },
  pro: {
    maxFileSize: 20,   // 20 MB per file
    totalStorage: 10000, // 10 GB total
  },
};

/**
 * Allowed File Types for Player Photos
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Upload Result
 */
export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

/**
 * Validate file before upload
 *
 * @param file - File to validate
 * @param plan - Workspace plan tier
 * @param currentStorageUsedMB - Current storage usage in MB
 * @returns Validation result
 */
export function validateFile(
  file: File,
  plan: WorkspacePlan,
  currentStorageUsedMB: number
): ValidationResult {
  const limits = STORAGE_LIMITS[plan];

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > limits.maxFileSize) {
    return {
      valid: false,
      error: `File too large. Maximum size for ${plan} plan: ${limits.maxFileSize} MB`,
    };
  }

  // Check total storage quota
  const newTotalStorage = currentStorageUsedMB + fileSizeMB;
  if (newTotalStorage > limits.totalStorage) {
    const remainingMB = limits.totalStorage - currentStorageUsedMB;
    return {
      valid: false,
      error: `Storage quota exceeded. ${remainingMB.toFixed(2)} MB remaining of ${limits.totalStorage} MB total`,
    };
  }

  return { valid: true };
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

/**
 * Extract storage path from Firebase Storage URL
 *
 * @param url - Firebase Storage download URL
 * @returns Storage path (e.g., "users/123/players/456/photos/file.jpg")
 */
export function extractStoragePath(url: string): string | null {
  try {
    // Firebase Storage URL format:
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);

    if (!pathMatch) return null;

    // Decode the path (e.g., "users%2F123%2Fplayers%2F456%2Fphotos%2Ffile.jpg")
    const encodedPath = pathMatch[1];
    return decodeURIComponent(encodedPath);
  } catch (error) {
    logger.warn('Failed to extract storage path from URL', { url });
    return null;
  }
}

/**
 * Get remaining storage quota for workspace
 *
 * @param plan - Workspace plan tier
 * @param currentStorageUsedMB - Current storage usage in MB
 * @returns Remaining storage in MB
 */
export function getRemainingStorage(plan: WorkspacePlan, currentStorageUsedMB: number): number {
  const limits = STORAGE_LIMITS[plan];
  return Math.max(0, limits.totalStorage - currentStorageUsedMB);
}

/**
 * Get storage usage percentage
 *
 * @param plan - Workspace plan tier
 * @param currentStorageUsedMB - Current storage usage in MB
 * @returns Usage percentage (0-100)
 */
export function getStorageUsagePercentage(
  plan: WorkspacePlan,
  currentStorageUsedMB: number
): number {
  const limits = STORAGE_LIMITS[plan];
  return Math.min(100, (currentStorageUsedMB / limits.totalStorage) * 100);
}
