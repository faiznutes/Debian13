/**
 * Data Encryption Service
 * Handles encryption at rest for sensitive data
 */

import crypto from 'crypto';
import logger from '../utils/logger';

class DataEncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private saltLength = 64;
  private tagLength = 16;

  /**
   * Get encryption key from environment or generate
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      logger.warn('ENCRYPTION_KEY not set, using default (NOT SECURE FOR PRODUCTION)');
      // In production, this should throw an error
      return crypto.scryptSync('default-key-change-in-production', 'salt', this.keyLength);
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypt data
   */
  encrypt(data: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag();

      // Combine IV, tag, and encrypted data
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error: any) {
      logger.error('Error encrypting data:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const parts = encryptedData.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      logger.error('Error decrypting data:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash sensitive data (one-way, for passwords, etc.)
   */
  hash(data: string, salt?: string): { hash: string; salt: string } {
    const usedSalt = salt || crypto.randomBytes(this.saltLength).toString('hex');
    const hash = crypto.pbkdf2Sync(data, usedSalt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: usedSalt };
  }

  /**
   * Verify hashed data
   */
  verify(data: string, hash: string, salt: string): boolean {
    const computedHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
    return computedHash === hash;
  }

  /**
   * Encrypt payment data (PCI DSS compliance)
   */
  encryptPaymentData(data: {
    cardNumber?: string;
    cvv?: string;
    expiryDate?: string;
    accountNumber?: string;
  }): string {
    // Remove sensitive data and encrypt
    const sanitized = {
      ...data,
      cardNumber: data.cardNumber ? this.maskCardNumber(data.cardNumber) : undefined,
      cvv: undefined, // Never store CVV
    };
    return this.encrypt(JSON.stringify(sanitized));
  }

  /**
   * Mask card number (show only last 4 digits)
   */
  private maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length < 4) return '****';
    return '****' + cleaned.slice(-4);
  }

  /**
   * Encrypt database field (for use in Prisma hooks)
   */
  encryptField(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
      return this.encrypt(value);
    } catch (error) {
      logger.error('Error encrypting field:', error);
      return null;
    }
  }

  /**
   * Decrypt database field (for use in Prisma hooks)
   */
  decryptField(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
      return this.decrypt(value);
    } catch (error) {
      logger.error('Error decrypting field:', error);
      return null;
    }
  }
}

export default new DataEncryptionService();

