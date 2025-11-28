/**
 * File Upload Validator Middleware
 * Validates file uploads (base64 data URLs, CSV files, etc.)
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_CSV_TYPES = ['text/csv', 'application/csv', 'text/plain'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CSV_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate base64 data URL
 */
function validateBase64DataURL(dataURL: string, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string; mimeType?: string; size?: number } {
  if (!dataURL || typeof dataURL !== 'string') {
    return { valid: false, error: 'Invalid data URL' };
  }

  // Check if it's a valid data URL
  const dataURLRegex = /^data:([^;]+);base64,(.+)$/;
  const match = dataURL.match(dataURLRegex);

  if (!match) {
    return { valid: false, error: 'Invalid data URL format' };
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];

  // Check MIME type
  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, error: `Invalid MIME type: ${mimeType}. Allowed types: ${allowedTypes.join(', ')}` };
  }

  // Calculate size (base64 is ~33% larger than original)
  const size = (base64Data.length * 3) / 4;

  // Check file size
  if (size > maxSize) {
    return { valid: false, error: `File size exceeds limit: ${(size / 1024 / 1024).toFixed(2)}MB > ${(maxSize / 1024 / 1024).toFixed(2)}MB` };
  }

  return { valid: true, mimeType, size };
}

/**
 * Validate image upload (base64 data URL)
 */
export const validateImageUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if image field exists
    if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:')) {
      const validation = validateBase64DataURL(req.body.image, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);

      if (!validation.valid) {
        logger.warn('Image upload validation failed', {
          error: validation.error,
          ip: req.ip,
          path: req.path,
        });
        return res.status(400).json({
          message: 'Image validation failed',
          error: validation.error,
        });
      }

      // Add validated metadata to request
      (req as any).imageMetadata = {
        mimeType: validation.mimeType,
        size: validation.size,
      };
    }

    next();
  } catch (error: any) {
    logger.error('Error in image upload validation', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      path: req.path,
    });
    return res.status(500).json({ message: 'Error validating image upload' });
  }
};

/**
 * Validate CSV file upload
 */
export const validateCSVUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if file is uploaded via multipart/form-data
    if (req.file) {
      // Check file type
      if (!ALLOWED_CSV_TYPES.includes(req.file.mimetype) && !req.file.originalname.endsWith('.csv')) {
        logger.warn('CSV upload validation failed - invalid file type', {
          mimetype: req.file.mimetype,
          filename: req.file.originalname,
          ip: req.ip,
          path: req.path,
        });
        return res.status(400).json({
          message: 'Invalid file type. Only CSV files are allowed.',
        });
      }

      // Check file size
      if (req.file.size > MAX_CSV_SIZE) {
        logger.warn('CSV upload validation failed - file too large', {
          size: req.file.size,
          maxSize: MAX_CSV_SIZE,
          ip: req.ip,
          path: req.path,
        });
        return res.status(400).json({
          message: `File size exceeds limit: ${(req.file.size / 1024 / 1024).toFixed(2)}MB > ${(MAX_CSV_SIZE / 1024 / 1024).toFixed(2)}MB`,
        });
      }

      // Add validated metadata to request
      (req as any).csvMetadata = {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      };
    } else if (req.body.csvData && typeof req.body.csvData === 'string') {
      // Handle CSV data as string (if sent as base64 or raw text)
      const size = Buffer.byteLength(req.body.csvData, 'utf8');

      if (size > MAX_CSV_SIZE) {
        logger.warn('CSV upload validation failed - data too large', {
          size,
          maxSize: MAX_CSV_SIZE,
          ip: req.ip,
          path: req.path,
        });
        return res.status(400).json({
          message: `CSV data size exceeds limit: ${(size / 1024 / 1024).toFixed(2)}MB > ${(MAX_CSV_SIZE / 1024 / 1024).toFixed(2)}MB`,
        });
      }

      // Add validated metadata to request
      (req as any).csvMetadata = {
        size,
      };
    }

    next();
  } catch (error: any) {
    logger.error('Error in CSV upload validation', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      path: req.path,
    });
    return res.status(500).json({ message: 'Error validating CSV upload' });
  }
};

/**
 * Sanitize file name to prevent path traversal and other attacks
 */
export function sanitizeFileName(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '').replace(/\//g, '').replace(/\\/g, '');

  // Remove special characters except alphanumeric, dash, underscore, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

