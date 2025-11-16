/**
 * Player Photo Upload Hook
 *
 * Phase 6 Task 5: Storage & Uploads
 *
 * React hook for uploading and deleting player profile photos.
 */

import { useState } from 'react';

interface UploadResult {
  url: string;
  size: number;
}

interface DeleteResult {
  success: boolean;
  sizeFreed: number;
}

export function usePlayerPhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload player profile photo
   *
   * @param file - File to upload
   * @param playerId - Player ID
   * @returns Upload result with URL and size
   */
  const uploadPhoto = async (file: File, playerId: string): Promise<UploadResult> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('playerId', playerId);

      const response = await fetch('/api/storage/upload-player-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload photo');
      }

      const result: UploadResult = await response.json();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Delete player profile photo
   *
   * @param playerId - Player ID
   * @returns Delete result
   */
  const deletePhoto = async (playerId: string): Promise<DeleteResult> => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/storage/delete-player-photo', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }

      const result: DeleteResult = await response.json();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  return {
    uploadPhoto,
    deletePhoto,
    uploading,
    deleting,
    error,
  };
}
