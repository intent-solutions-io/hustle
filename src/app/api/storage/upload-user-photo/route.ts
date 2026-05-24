import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAdminAuth } from '@/lib/firebase/admin';
import { validateFile, extractStoragePath } from '@/lib/firebase/storage-utils';
import { uploadUserPhotoAdmin, deletePlayerPhotoAdmin } from '@/lib/firebase/admin-storage';
import { getUserProfileAdmin, updateUserProfileAdmin } from '@/lib/db/queries/users';
import { getWorkspaceByIdAdmin, updateWorkspaceStorageUsageAdmin } from '@/lib/db/queries/workspaces';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/storage/upload-user-photo');

export async function POST(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing required field: file' }, { status: 400 });
    }

    // Get user and workspace for plan limits
    const user = await getUserProfileAdmin(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const workspace = user.defaultWorkspaceId
      ? await getWorkspaceByIdAdmin(user.defaultWorkspaceId)
      : null;

    if (workspace && !['active', 'trial'].includes(workspace.status)) {
      return NextResponse.json(
        { error: 'Workspace is not active', code: 'WORKSPACE_INACTIVE' },
        { status: 403 }
      );
    }

    // Validate file — use workspace plan or default to 'free'
    const plan = workspace?.plan ?? 'free';
    const storageUsed = workspace?.usage?.storageUsedMB ?? 0;
    const validation = validateFile(file, plan, storageUsed);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 413 });
    }

    // Delete old photo if exists
    let oldPhotoSizeMB = 0;
    if (user.photoUrl) {
      const oldPath = extractStoragePath(user.photoUrl);
      if (oldPath) {
        try {
          oldPhotoSizeMB = await deletePlayerPhotoAdmin(oldPath);
        } catch (error) {
          logger.warn('Failed to delete old user photo', { userId, error });
        }
      }
    }

    // Upload new photo
    const uploadResult = await uploadUserPhotoAdmin({ file, userId });

    // Update Firestore user document
    await updateUserProfileAdmin(userId, { photoUrl: uploadResult.url });

    // Update Firebase Auth photoURL so header picks it up
    await getAdminAuth().updateUser(userId, { photoURL: uploadResult.url });

    // Update workspace storage usage if workspace exists
    if (workspace) {
      const netStorageChange = uploadResult.size - oldPhotoSizeMB;
      await updateWorkspaceStorageUsageAdmin(workspace.id, netStorageChange);
    }

    logger.info('User photo uploaded', { userId, size: uploadResult.size });

    return NextResponse.json({ url: uploadResult.url, size: uploadResult.size });
  } catch (error: any) {
    logger.error('Upload user photo failed', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
