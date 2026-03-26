/**
 * Firebase Storage Utilities (Isomorphic)
 *
 * Shared helpers that do not depend on the Firebase client SDK.
 * Safe to import from both server (API routes) and client components.
 */

import type { WorkspacePlan } from '@/types/firestore';

/**
 * Storage Limits by Plan
 *
 * Controls maximum file upload size and total workspace storage.
 */
export const STORAGE_LIMITS: Record<
  WorkspacePlan,
  {
    maxFileSize: number; // Max single file size in MB
    totalStorage: number; // Total storage quota in MB
  }
> = {
  free: {
    maxFileSize: 2,
    totalStorage: 50,
  },
  starter: {
    maxFileSize: 5,
    totalStorage: 500,
  },
  plus: {
    maxFileSize: 10,
    totalStorage: 2000,
  },
  pro: {
    maxFileSize: 20,
    totalStorage: 10000,
  },
};

/**
 * Allowed File Types for Player Photos
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
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

    const encodedPath = pathMatch[1];
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}

export function getRemainingStorage(plan: WorkspacePlan, currentStorageUsedMB: number): number {
  const limits = STORAGE_LIMITS[plan];
  return Math.max(0, limits.totalStorage - currentStorageUsedMB);
}

export function getStorageUsagePercentage(
  plan: WorkspacePlan,
  currentStorageUsedMB: number
): number {
  const limits = STORAGE_LIMITS[plan];
  return Math.min(100, (currentStorageUsedMB / limits.totalStorage) * 100);
}

