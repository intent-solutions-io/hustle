/**
 * Firebase Admin Storage Helpers (Server-Side)
 *
 * Uses Google Cloud Storage via Firebase Admin SDK.
 * Generates Firebase-style download URLs by setting `firebaseStorageDownloadTokens`.
 */

import { randomUUID } from 'crypto';
import { getAdminStorageBucket } from '@/lib/firebase/admin';

export interface AdminUploadResult {
  url: string;
  path: string;
  size: number; // MB
}

function getFirebaseDownloadUrl(bucketName: string, objectPath: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
}

export async function uploadPlayerPhotoAdmin(params: {
  file: File;
  userId: string;
  playerId: string;
}): Promise<AdminUploadResult> {
  const { file, userId, playerId } = params;

  const extension = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const filename = `player-${playerId}-${timestamp}.${extension}`;
  const objectPath = `users/${userId}/players/${playerId}/photos/${filename}`;

  const bucket = getAdminStorageBucket();
  const gcsFile = bucket.file(objectPath);

  const buffer = Buffer.from(await file.arrayBuffer());
  const token = randomUUID();

  await gcsFile.save(buffer, {
    resumable: false,
    contentType: file.type,
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token,
        userId,
        playerId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    },
  });

  const fileSizeMB = file.size / (1024 * 1024);

  return {
    url: getFirebaseDownloadUrl(bucket.name, objectPath, token),
    path: objectPath,
    size: fileSizeMB,
  };
}

export async function deletePlayerPhotoAdmin(storagePath: string): Promise<number> {
  const bucket = getAdminStorageBucket();
  const gcsFile = bucket.file(storagePath);

  try {
    const [metadata] = await gcsFile.getMetadata();
    const sizeBytes = typeof metadata.size === 'string' ? Number(metadata.size) : (metadata.size as number);
    const fileSizeMB = sizeBytes / (1024 * 1024);

    await gcsFile.delete({ ignoreNotFound: true });
    return fileSizeMB;
  } catch (error: any) {
    const code = error?.code;
    if (code === 404) return 0;
    throw error;
  }
}

