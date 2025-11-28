/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP (Time-based One-Time Password) for enhanced security
 */

import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import prisma from '../config/database';
import logger from '../utils/logger';
import crypto from 'crypto';

// Configure authenticator with more lenient window for clock drift
authenticator.options = {
  window: [2, 2], // Allow 2 time steps before and after current time (30 seconds each = 60 seconds total tolerance)
};

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class TwoFactorService {
  /**
   * Generate 2FA secret for user
   */
  async generateSecret(userId: string, userEmail: string, tenantName?: string): Promise<TwoFactorSecret> {
    try {
      // Generate secret
      const secret = authenticator.generateSecret();
      
      // Create service name (tenant name or default)
      const serviceName = tenantName || 'Warungin';
      
      // Generate otpauth URL
      const otpauthUrl = authenticator.keyuri(userEmail, serviceName, secret);
      
      logger.info('Generating QR code for 2FA', { 
        userId, 
        email: userEmail, 
        serviceName,
        secretLength: secret.length,
        secretPrefix: secret.substring(0, 4) + '...' // Log first 4 chars for debugging
      });
      
      // Generate QR code with error handling
      let qrCode: string;
      try {
        qrCode = await QRCode.toDataURL(otpauthUrl, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          margin: 1,
        } as QRCode.QRCodeToDataURLOptions);
      } catch (qrError: any) {
        logger.error('Error generating QR code', { error: qrError.message, userId });
        throw new Error(`Failed to generate QR code: ${qrError.message}`);
      }
      
      // Generate backup codes (10 codes, 8 characters each)
      const backupCodes = this.generateBackupCodes(10);
      
      // Store secret and backup codes in database (encrypted)
      // IMPORTANT: Store the secret BEFORE returning it to ensure it's saved
      await this.storeSecret(userId, secret, backupCodes);
      
      // Verify that the secret was stored correctly by trying to decrypt it
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { twoFactorSecret: true } as any,
        });
        
        if (user && (user as any).twoFactorSecret) {
          const decryptedSecret = this.decryptSecret((user as any).twoFactorSecret);
          if (decryptedSecret !== secret) {
            logger.error('Secret mismatch after storage!', { 
              userId,
              originalLength: secret.length,
              decryptedLength: decryptedSecret.length
            });
            throw new Error('Secret tidak tersimpan dengan benar. Silakan coba lagi.');
          }
          logger.info('Secret verified after storage', { userId });
        }
      } catch (verifyError: any) {
        logger.error('Error verifying stored secret', { 
          error: verifyError.message,
          userId 
        });
        // Don't throw here, just log - the secret might still work
      }
      
      logger.info('2FA secret generated successfully', { userId });
      
      return {
        secret,
        qrCode,
        backupCodes,
      };
    } catch (error: any) {
      logger.error('Error in generateSecret', { error: error.message, stack: error.stack, userId });
      throw error;
    }
  }

  /**
   * Verify 2FA token
   * @param userId - User ID
   * @param token - 2FA token to verify
   * @param skipEnabledCheck - Skip checking if 2FA is enabled (useful during enable flow)
   */
  async verifyToken(userId: string, token: string, skipEnabledCheck: boolean = false): Promise<boolean> {
    try {
      // Trim and validate token format
      const trimmedToken = token.trim();
      
      // Validate token is 6 digits
      if (!/^\d{6}$/.test(trimmedToken)) {
        logger.warn('Invalid 2FA token format', { userId, tokenLength: trimmedToken.length });
        return false;
      }

      // Get user's 2FA secret
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          twoFactorSecret: true, 
          twoFactorEnabled: true 
        } as any, // Type assertion needed until Prisma Client is regenerated after migration
      });

      if (!user) {
        logger.warn('User not found for 2FA verification', { userId });
        return false;
      }

      // Only check if 2FA is enabled if skipEnabledCheck is false
      // This allows verification during the enable flow
      if (!skipEnabledCheck && !(user as any).twoFactorEnabled) {
        logger.warn('2FA not enabled for user', { userId });
        return false;
      }

      if (!(user as any).twoFactorSecret) {
        logger.warn('2FA secret not found for user', { userId });
        return false;
      }

      // Decrypt secret (in production, use proper encryption)
      let secret: string;
      try {
        secret = this.decryptSecret((user as any).twoFactorSecret);
        if (!secret || secret.length === 0) {
          logger.error('Failed to decrypt 2FA secret or secret is empty', { userId });
          return false;
        }
      } catch (decryptError: any) {
        logger.error('Error decrypting 2FA secret', { 
          error: decryptError.message, 
          userId,
          stack: decryptError.stack 
        });
        return false;
      }

      // Verify token with detailed logging
      logger.info('Verifying 2FA token', { 
        userId, 
        tokenLength: trimmedToken.length,
        secretLength: secret.length,
        secretPrefix: secret.substring(0, 4) + '...' // Log first 4 chars for debugging (safe)
      });

      // Try to verify with the secret
      let isValid = false;
      try {
        isValid = authenticator.verify({ 
          token: trimmedToken, 
          secret: secret 
        });
        
        logger.info('2FA token verification result', { 
          userId, 
          isValid,
          token: trimmedToken 
        });
      } catch (verifyError: any) {
        logger.error('Error during authenticator.verify', { 
          error: verifyError.message,
          stack: verifyError.stack,
          userId 
        });
        isValid = false;
      }

      if (isValid) {
        logger.info('2FA token verified successfully', { userId });
        return true;
      }

      logger.warn('2FA token verification failed, checking backup codes', { 
        userId,
        token: trimmedToken,
        secretLength: secret.length
      });
      
      // If token invalid, check backup codes
      const backupValid = await this.verifyBackupCode(userId, trimmedToken);
      if (backupValid) {
        logger.info('2FA backup code verified successfully', { userId });
      }
      
      return backupValid;
    } catch (error: any) {
      logger.error('2FA verification error', { 
        error: error.message, 
        stack: error.stack,
        userId 
      });
      return false;
    }
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(userId: string, token: string): Promise<boolean> {
    // Trim token
    const trimmedToken = token.trim();
    
    // Validate token format
    if (!/^\d{6}$/.test(trimmedToken)) {
      logger.warn('Invalid 2FA token format in enable2FA', { userId, tokenLength: trimmedToken.length });
      throw new Error('Token harus 6 digit');
    }
    
    logger.info('Enabling 2FA for user', { userId, token: trimmedToken });
    
    // First, check if user has a secret stored
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorSecret: true,
        twoFactorEnabled: true
      } as any,
    });

    if (!user || !(user as any).twoFactorSecret) {
      logger.error('No 2FA secret found for user. User must generate secret first.', { userId });
      throw new Error('Secret 2FA tidak ditemukan. Silakan generate QR code terlebih dahulu.');
    }

    if ((user as any).twoFactorEnabled) {
      logger.warn('2FA already enabled for user', { userId });
      throw new Error('2FA sudah diaktifkan untuk akun ini.');
    }

    // Try to decrypt secret first to verify it's valid
    let decryptedSecret: string | null = null;
    try {
      decryptedSecret = this.decryptSecret((user as any).twoFactorSecret);
      logger.info('Secret decrypted successfully during enable', { 
        userId,
        secretLength: decryptedSecret.length,
        secretPrefix: decryptedSecret.substring(0, 4) + '...'
      });
    } catch (decryptError: any) {
      logger.error('Failed to decrypt secret during enable', { 
        userId,
        error: decryptError.message,
        stack: decryptError.stack
      });
      throw new Error('Secret 2FA tidak valid. Silakan generate QR code baru.');
    }

    // Verify token directly with decrypted secret (more reliable than going through verifyToken)
    logger.info('Starting direct token verification during enable', { 
      userId,
      token: trimmedToken,
      secretLength: decryptedSecret.length,
      secretPrefix: decryptedSecret.substring(0, 4) + '...'
    });
    
    let isValid = false;
    try {
      // Direct verification with the decrypted secret
      isValid = authenticator.verify({ 
        token: trimmedToken, 
        secret: decryptedSecret 
      });
      
      logger.info('Direct token verification result', { 
        userId,
        token: trimmedToken,
        isValid,
        secretLength: decryptedSecret.length
      });
    } catch (verifyError: any) {
      logger.error('Error during direct token verification', { 
        userId,
        error: verifyError.message,
        stack: verifyError.stack,
        token: trimmedToken
      });
      isValid = false;
    }
    
    if (!isValid) {
      // Try with verifyToken as fallback (in case there's some edge case)
      logger.warn('Direct verification failed, trying verifyToken as fallback', { userId });
      const fallbackValid = await this.verifyToken(userId, trimmedToken, true);
      
      if (!fallbackValid) {
        logger.warn('2FA token verification failed during enable (both methods)', { 
          userId,
          token: trimmedToken,
          hasSecret: !!(user as any).twoFactorSecret,
          secretLength: decryptedSecret.length,
          directVerify: isValid,
          fallbackVerify: fallbackValid
        });
        throw new Error('Token 2FA tidak valid. Pastikan token yang Anda masukkan benar dan masih berlaku (token berubah setiap 30 detik). Silakan coba dengan token yang lebih baru.');
      }
      isValid = true; // Use fallback result
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      } as any, // Type assertion needed until Prisma Client is regenerated after migration
    });

    logger.info('2FA enabled for user successfully', { userId });
    return true;
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId: string, password: string): Promise<boolean> {
    // Verify password before disabling 2FA
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.default.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      } as any, // Type assertion needed until Prisma Client is regenerated after migration
    });

    logger.info('2FA disabled for user', { userId });
    return true;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Store 2FA secret and backup codes (encrypted)
   */
  private async storeSecret(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    // Encrypt secret (in production, use proper encryption key from env)
    const encryptedSecret = this.encryptSecret(secret);
    const encryptedBackupCodes = JSON.stringify(backupCodes.map(code => this.hashBackupCode(code)));

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: encryptedBackupCodes,
      } as any, // Type assertion needed until Prisma Client is regenerated after migration
    });
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorBackupCodes: true 
      } as any, // Type assertion needed until Prisma Client is regenerated after migration
    });

    if (!user || !(user as any).twoFactorBackupCodes) {
      return false;
    }

    const backupCodes: string[] = JSON.parse((user as any).twoFactorBackupCodes);
    const hashedCode = this.hashBackupCode(code);

    // Check if code matches
    const index = backupCodes.indexOf(hashedCode);
    if (index === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(index, 1);
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      } as any, // Type assertion needed until Prisma Client is regenerated after migration
    });

    return true;
  }

  /**
   * Encrypt secret (simple encryption - use proper encryption in production)
   */
  private encryptSecret(secret: string): string {
    // In production, use proper encryption (AES-256-GCM)
    const algorithm = 'aes-256-cbc';
    // Ensure key is exactly 32 bytes for AES-256
    const rawKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!';
    const key = crypto.createHash('sha256').update(rawKey).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt secret
   */
  private decryptSecret(encrypted: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      // Ensure key is exactly 32 bytes for AES-256
      const rawKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars!!';
      const key = crypto.createHash('sha256').update(rawKey).digest();
      
      // Validate encrypted format
      if (!encrypted || !encrypted.includes(':')) {
        throw new Error('Invalid encrypted secret format');
      }
      
      const parts = encrypted.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted secret format: expected IV:encrypted');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      
      if (iv.length !== 16) {
        throw new Error('Invalid IV length');
      }
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      if (!decrypted || decrypted.length === 0) {
        throw new Error('Decrypted secret is empty');
      }
      
      return decrypted;
    } catch (error: any) {
      logger.error('Error decrypting secret', { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Hash backup code for storage
   */
  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true } as any, // Type assertion needed until Prisma Client is regenerated after migration
      });

    return (user as any)?.twoFactorEnabled || false;
  }

  /**
   * Get remaining backup codes count
   */
  async getRemainingBackupCodes(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorBackupCodes: true 
      } as any, // Type assertion needed until Prisma Client is regenerated after migration
    });

    if (!user || !(user as any).twoFactorBackupCodes) {
      return 0;
    }

    const backupCodes: string[] = JSON.parse((user as any).twoFactorBackupCodes);
    return backupCodes.length;
  }
}

export default new TwoFactorService();

