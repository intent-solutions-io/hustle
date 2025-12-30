/**
 * Firebase Server Provisioning
 *
 * Guarantees that an authenticated Firebase user has:
 * - `/users/{uid}` profile document
 * - A default workspace in `/workspaces/{workspaceId}`
 *
 * This prevents "login works but redirects back to /login" failures when the
 * session cookie is valid but required Firestore documents are missing.
 *
 * Server-only: uses Firebase Admin SDK.
 */

import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

function splitName(displayName: string | undefined | null, fallbackEmail: string | null): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (displayName || '').trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ');
    return { firstName, lastName };
  }

  const emailPrefix = (fallbackEmail || '').split('@')[0] || '';
  return { firstName: emailPrefix || 'User', lastName: '' };
}

function workspaceNameFromUser(user: { displayName?: string | null; email?: string | null }): string {
  const name = (user.displayName || '').trim();
  if (name) return `${name} Workspace`;
  const prefix = (user.email || '').split('@')[0];
  return prefix ? `${prefix} Workspace` : 'Hustle Workspace';
}

export async function ensureUserProvisioned(claims: DecodedIdToken): Promise<{
  userId: string;
  workspaceId: string;
}> {
  const userId = claims.uid;
  const emailVerified = Boolean(claims.email_verified);

  const userRef = adminDb.collection('users').doc(userId);

  // Fast path: user + default workspace exist, only patch minimal drift (emailVerified, missing profile fields).
  try {
    const existingUserSnap = await userRef.get();
    if (existingUserSnap.exists) {
      const existingUser = existingUserSnap.data() as any;
      const workspaceId =
        typeof existingUser?.defaultWorkspaceId === 'string' && existingUser.defaultWorkspaceId.length > 0
          ? existingUser.defaultWorkspaceId
          : null;

      if (workspaceId) {
        const workspaceSnap = await adminDb.collection('workspaces').doc(workspaceId).get();
        if (workspaceSnap.exists) {
          const updates: Record<string, unknown> = {};

          if (typeof existingUser?.emailVerified === 'boolean' && existingUser.emailVerified !== emailVerified) {
            updates.emailVerified = emailVerified;
          }

          const needsAuthProfile =
            !existingUser?.email ||
            !existingUser?.firstName ||
            (!existingUser?.lastName && existingUser?.lastName !== '') ||
            (!existingUser?.phone && existingUser?.phone !== null);

          if (needsAuthProfile) {
            const authUser = await adminAuth.getUser(userId).catch(() => null);
            const email = authUser?.email || claims.email || '';
            const phone = authUser?.phoneNumber || null;
            const { firstName, lastName } = splitName(authUser?.displayName, email || null);

            if (!existingUser?.email && email) updates.email = email;
            if (!existingUser?.firstName && firstName) updates.firstName = firstName;
            if (!existingUser?.lastName && lastName) updates.lastName = lastName;
            if (!existingUser?.phone && phone) updates.phone = phone;
          }

          if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date();
            await userRef.set(updates, { merge: true });
          }

          return { userId, workspaceId };
        }
      }
    }
  } catch {
    // Fall through to slow path.
  }

  // Slow path: missing user doc and/or missing default workspace.
  // Pull richer profile data (displayName/phone) from Firebase Auth if available.
  // Avoid failing provisioning if this call fails (e.g., transient Auth issues).
  const authUser = await adminAuth.getUser(userId).catch(() => null);
  const email = authUser?.email || claims.email || '';
  const phone = authUser?.phoneNumber || null;
  const { firstName, lastName } = splitName(authUser?.displayName, email || null);

  // Used only if we need to create a new workspace.
  let existingPlayerCount = 0;
  try {
    const playersSnap = await adminDb.collection(`users/${userId}/players`).get();
    existingPlayerCount = playersSnap.size;
  } catch {
    existingPlayerCount = 0;
  }

  const now = new Date();

  const result = await adminDb.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const userData = userSnap.exists ? (userSnap.data() as any) : null;

    const currentDefaultWorkspaceId =
      typeof userData?.defaultWorkspaceId === 'string' && userData.defaultWorkspaceId.length > 0
        ? userData.defaultWorkspaceId
        : null;

    let workspaceId = currentDefaultWorkspaceId;
    let workspaceRef: FirebaseFirestore.DocumentReference | null = null;

    // If a default workspace is referenced, ensure it exists.
    if (workspaceId) {
      const candidateRef = adminDb.collection('workspaces').doc(workspaceId);
      const candidateSnap = await tx.get(candidateRef);
      if (candidateSnap.exists) {
        workspaceRef = candidateRef;
      } else {
        workspaceId = null;
      }
    }

    // Create a new workspace if missing.
    if (!workspaceId) {
      workspaceRef = adminDb.collection('workspaces').doc();
      workspaceId = workspaceRef.id;

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      tx.set(workspaceRef, {
        ownerUserId: userId,
        name: workspaceNameFromUser({ displayName: authUser?.displayName || null, email: email || null }),
        plan: 'free',
        status: 'trial',
        members: email
          ? [
              {
                userId,
                email,
                role: 'owner',
                addedAt: now,
                addedBy: userId,
              },
            ]
          : [],
        billing: {
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: trialEndDate,
        },
        usage: {
          playerCount: existingPlayerCount,
          gamesThisMonth: 0,
          storageUsedMB: 0,
        },
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }

    // Create or patch `/users/{uid}`.
    if (!userSnap.exists) {
      tx.set(userRef, {
        defaultWorkspaceId: workspaceId,
        ownedWorkspaces: [workspaceId],
        firstName,
        lastName,
        email,
        phone,
        emailVerified,
        agreedToTerms: true,
        agreedToPrivacy: true,
        isParentGuardian: true,
        termsAgreedAt: now,
        privacyAgreedAt: now,
        verificationPinHash: null,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const updates: Record<string, unknown> = {};

      if (!currentDefaultWorkspaceId || currentDefaultWorkspaceId !== workspaceId) {
        updates.defaultWorkspaceId = workspaceId;
      }

      const ownedWorkspaces = Array.isArray(userData?.ownedWorkspaces)
        ? (userData.ownedWorkspaces as unknown[]).filter((w): w is string => typeof w === 'string' && w.length > 0)
        : [];
      if (!ownedWorkspaces.includes(workspaceId)) {
        updates.ownedWorkspaces = [...ownedWorkspaces, workspaceId];
      }

      if (!userData?.firstName && firstName) {
        updates.firstName = firstName;
      }
      if (!userData?.lastName && lastName) {
        updates.lastName = lastName;
      }
      if (!userData?.email && email) {
        updates.email = email;
      }
      if (!userData?.phone && phone) {
        updates.phone = phone;
      }

      // Keep Firestore emailVerified in sync with Auth.
      if (typeof userData?.emailVerified === 'boolean' && userData.emailVerified !== emailVerified) {
        updates.emailVerified = emailVerified;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = now;
        tx.set(userRef, updates, { merge: true });
      }
    }

    return { userId, workspaceId };
  });

  return result;
}
