import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAdminAuth } from '@/lib/firebase/admin';
import { extractStoragePath } from '@/lib/firebase/storage-utils';
import { deletePlayerPhotoAdmin } from '@/lib/firebase/admin-storage';
import { getUserProfileAdmin, updateUserProfileAdmin } from '@/lib/firebase/admin-services/users';
import { updateWorkspaceStorageUsageAdmin } from '@/lib/firebase/admin-services/workspaces';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/storage/delete-user-photo');

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await getUserProfileAdmin(userId);
    if (!user?.photoUrl) {
      return NextResponse.json({ error: 'No profile photo to delete' }, { status: 404 });
    }

    const storagePath = extractStoragePath(user.photoUrl);
    if (!storagePath) {
      return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 });
    }

    // Delete from storage
    const sizeFreed = await deletePlayerPhotoAdmin(storagePath);

    // Clear Firestore
    await updateUserProfileAdmin(userId, { photoUrl: null });

    // Clear Firebase Auth photoURL
    await getAdminAuth().updateUser(userId, { photoURL: '' });

    // Update workspace storage
    if (user.defaultWorkspaceId) {
      await updateWorkspaceStorageUsageAdmin(user.defaultWorkspaceId, -sizeFreed);
    }

    logger.info('User photo deleted', { userId, sizeFreed });

    return NextResponse.json({ success: true, sizeFreed });
  } catch (error: any) {
    logger.error('Delete user photo failed', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
