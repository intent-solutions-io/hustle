import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Generate a secure random token using crypto.randomBytes
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate an email verification token for a user
 * Deletes any existing tokens for the user before creating a new one
 * Token expires in 24 hours
 *
 * @param userId - The user ID to generate the token for
 * @returns The created verification token object
 */
export async function generateEmailVerificationToken(userId: string) {
  // Delete any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  });

  const token = generateSecureToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const verificationToken = await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expires,
    },
  });

  return verificationToken;
}

/**
 * Generate a password reset token for a user
 * Deletes any existing tokens for the user before creating a new one
 * Token expires in 1 hour
 *
 * @param userId - The user ID to generate the token for
 * @returns The created password reset token object
 */
export async function generatePasswordResetToken(userId: string) {
  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });

  const token = generateSecureToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const resetToken = await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expires,
    },
  });

  return resetToken;
}

/**
 * Verify an email verification token
 * Checks if token exists, is not expired, and belongs to a valid user
 *
 * @param token - The token to verify
 * @returns The token object with user data, or null if invalid/expired
 */
export async function verifyEmailToken(token: string) {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    return null;
  }

  if (verificationToken.expires < new Date()) {
    // Token expired, delete it
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
    return null;
  }

  return verificationToken;
}

/**
 * Verify a password reset token
 * Checks if token exists, is not expired, and belongs to a valid user
 *
 * @param token - The token to verify
 * @returns The token object with user data, or null if invalid/expired
 */
export async function verifyPasswordResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return null;
  }

  if (resetToken.expires < new Date()) {
    // Token expired, delete it
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });
    return null;
  }

  return resetToken;
}

/**
 * Delete an email verification token after use
 *
 * @param tokenId - The token ID to delete
 */
export async function deleteEmailVerificationToken(tokenId: string) {
  await prisma.emailVerificationToken.delete({
    where: { id: tokenId },
  });
}

/**
 * Delete a password reset token after use
 *
 * @param tokenId - The token ID to delete
 */
export async function deletePasswordResetToken(tokenId: string) {
  await prisma.passwordResetToken.delete({
    where: { id: tokenId },
  });
}
