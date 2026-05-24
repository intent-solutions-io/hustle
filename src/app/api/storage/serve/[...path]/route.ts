/**
 * GET /api/storage/serve/{userId}/...
 *
 * Auth-gated static-file serve route for user-uploaded photos. The first
 * path segment is the owning userId; we 403 if the requesting session
 * doesn't own that path (and isn't a workspace-shared accessor — covered by
 * checking workspace membership for players the userId hosts).
 *
 * Streams the file with proper Content-Type and a short private cache.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { auth } from '@/lib/auth';
import { resolveServePath } from '@/lib/storage/local';
import { getUserProfileAdmin } from '@/lib/db/queries/users';
import { getWorkspaceByIdAdmin } from '@/lib/db/queries/workspaces';

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function contentTypeFor(absolutePath: string): string {
  const ext = path.extname(absolutePath).slice(1).toLowerCase();
  return CONTENT_TYPE_BY_EXT[ext] ?? 'application/octet-stream';
}

/**
 * Authorise the requester for a path. Returns true if the session user is
 * the owning userId, OR if they share any workspace with that owner (covers
 * the case where a workspace member needs to render another member's child
 * player photos).
 */
async function isAuthorised(
  sessionUserId: string,
  pathOwnerUserId: string
): Promise<boolean> {
  if (sessionUserId === pathOwnerUserId) return true;

  // Workspace-shared access: a member of the path owner's default workspace
  // gets read access to that owner's uploaded media. This matches how
  // workspace members already see each other's players + games.
  const pathOwner = await getUserProfileAdmin(pathOwnerUserId);
  if (!pathOwner?.defaultWorkspaceId) return false;
  const workspace = await getWorkspaceByIdAdmin(pathOwner.defaultWorkspaceId);
  if (!workspace) return false;
  return workspace.members.some((m) => m.userId === sessionUserId);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const session = await auth(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path: segments } = await context.params;
  if (!segments || segments.length < 1) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const pathOwnerUserId = segments[0];

  if (!(await isAuthorised(session.user.id, pathOwnerUserId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const relativePath = segments.join('/');
  const resolved = await resolveServePath(relativePath);
  if (!resolved) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data = await fs.readFile(resolved.absolute);
  // node Buffer is acceptable to NextResponse — convert to ArrayBuffer for
  // stricter TS edge runtimes.
  const ab = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  );

  return new NextResponse(ab as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentTypeFor(resolved.absolute),
      'Content-Length': String(resolved.size),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
