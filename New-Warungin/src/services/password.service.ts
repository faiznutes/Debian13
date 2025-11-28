/**
 * Password Service
 * Enhanced password management with history and policy enforcement
 */

import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import logger from '../utils/logger';
import { checkPasswordStrength, PasswordStrength } from '../validators/password.validator';

export interface PasswordHistoryEntry {
  password: string; // Hashed
  createdAt: Date;
}

export class PasswordService {
  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Check password strength
   */
  checkStrength(password: string): PasswordStrength {
    return checkPasswordStrength(password);
  }

  /**
   * Check if password is in history (prevent reuse)
   */
  async isPasswordInHistory(userId: string, newPassword: string, historyCount: number = 5): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHistory: true },
    });

    if (!user || !user.passwordHistory) {
      return false;
    }

    try {
      const history: PasswordHistoryEntry[] = JSON.parse(user.passwordHistory as string);
      const recentHistory = history.slice(-historyCount);

      // Check against recent passwords
      for (const entry of recentHistory) {
        const matches = await this.verifyPassword(newPassword, entry.password);
        if (matches) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking password history', { error, userId });
      return false;
    }
  }

  /**
   * Add password to history
   */
  async addToHistory(userId: string, hashedPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHistory: true },
    });

    const maxHistory = 10; // Keep last 10 passwords
    let history: PasswordHistoryEntry[] = [];

    if (user?.passwordHistory) {
      try {
        history = JSON.parse(user.passwordHistory as string);
      } catch (error) {
        logger.warn('Error parsing password history', { error, userId });
        history = [];
      }
    }

    // Add new password
    history.push({
      password: hashedPassword,
      createdAt: new Date(),
    });

    // Keep only last maxHistory entries
    if (history.length > maxHistory) {
      history = history.slice(-maxHistory);
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHistory: JSON.stringify(history),
      },
    });
  }

  /**
   * Update password with history check
   */
  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    enforceHistory: boolean = true
  ): Promise<void> {
    // Verify old password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValidOldPassword = await this.verifyPassword(oldPassword, user.password);
    if (!isValidOldPassword) {
      throw new Error('Password lama tidak benar');
    }

    // Check password strength
    const strength = this.checkStrength(newPassword);
    if (!strength.meetsRequirements) {
      throw new Error(`Password tidak memenuhi persyaratan: ${strength.feedback.join(', ')}`);
    }

    // Check password history
    if (enforceHistory) {
      const inHistory = await this.isPasswordInHistory(userId, newPassword);
      if (inHistory) {
        throw new Error('Password ini sudah pernah digunakan sebelumnya. Gunakan password yang berbeda.');
      }
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password and add to history
    await prisma.$transaction(async (tx) => {
      // Add old password to history before updating
      await this.addToHistory(userId, user.password);

      // Update password
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          mustChangePassword: false, // Reset flag if exists
        },
      });
    });

    logger.info('Password updated', { userId });
  }

  /**
   * Force password change on first login
   */
  async setMustChangePassword(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        mustChangePassword: true,
      },
    });
  }

  /**
   * Check if password must be changed
   */
  async mustChangePassword(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mustChangePassword: true, passwordChangedAt: true },
    });

    if (!user) {
      return false;
    }

    // Check mustChangePassword flag
    if (user.mustChangePassword) {
      return true;
    }

    // Check password expiration (optional, 90 days)
    const passwordExpirationDays = 90;
    if (user.passwordChangedAt) {
      const daysSinceChange = Math.floor(
        (Date.now() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceChange > passwordExpirationDays) {
        return true;
      }
    }

    return false;
  }
}

export default new PasswordService();

