import { useState } from 'react';

interface UploadResult {
  url: string;
  size: number;
}

interface DeleteResult {
  success: boolean;
  sizeFreed: number;
}

export function useUserPhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = async (file: File): Promise<UploadResult> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/storage/upload-user-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload photo');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (): Promise<DeleteResult> => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/storage/delete-user-photo', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  return { uploadPhoto, deletePhoto, uploading, deleting, error };
}
