import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import logger from './logger';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp';
  outputPath?: string;
}

export interface ImageOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercentage: number;
  outputPath: string;
  width: number;
  height: number;
}

/**
 * Image optimization utility
 * Compresses and resizes images for better performance
 */
export class ImageOptimizer {
  /**
   * Optimize an image file
   */
  static async optimize(
    inputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<ImageOptimizationResult> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 85,
      format = 'webp',
      outputPath,
    } = options;

    try {
      // Read original file stats
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      // Determine output path
      const finalOutputPath = outputPath || this.getOutputPath(inputPath, format);

      // Ensure output directory exists
      const outputDir = path.dirname(finalOutputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Get image metadata
      const metadata = await sharp(inputPath).metadata();

      // Calculate new dimensions (maintain aspect ratio)
      let width = metadata.width || maxWidth;
      let height = metadata.height || maxHeight;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        if (width > height) {
          width = maxWidth;
          height = Math.round(maxWidth / aspectRatio);
        } else {
          height = maxHeight;
          width = Math.round(maxHeight * aspectRatio);
        }
      }

      // Optimize image
      const pipeline = sharp(inputPath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });

      // Apply format-specific optimizations
      if (format === 'webp') {
        await pipeline.webp({ quality }).toFile(finalOutputPath);
      } else if (format === 'jpeg') {
        await pipeline.jpeg({ quality, mozjpeg: true }).toFile(finalOutputPath);
      } else if (format === 'png') {
        await pipeline.png({ quality, compressionLevel: 9 }).toFile(finalOutputPath);
      }

      // Get optimized file stats
      const optimizedStats = await fs.stat(finalOutputPath);
      const optimizedSize = optimizedStats.size;

      const savedBytes = originalSize - optimizedSize;
      const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(2);

      logger.info(
        `Image optimized: ${path.basename(inputPath)} - ` +
        `Original: ${(originalSize / 1024).toFixed(2)}KB, ` +
        `Optimized: ${(optimizedSize / 1024).toFixed(2)}KB, ` +
        `Saved: ${savedPercentage}%`
      );

      return {
        originalSize,
        optimizedSize,
        savedBytes,
        savedPercentage: parseFloat(savedPercentage),
        outputPath: finalOutputPath,
        width,
        height,
      };
    } catch (error) {
      logger.error(`Failed to optimize image ${inputPath}:`, error);
      throw error;
    }
  }

  /**
   * Optimize image from buffer (for uploads)
   */
  static async optimizeBuffer(
    buffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<{ buffer: Buffer; metadata: ImageOptimizationResult }> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 85,
      format = 'webp',
    } = options;

    try {
      // Get image metadata
      const metadata = await sharp(buffer).metadata();

      // Calculate new dimensions
      let width = metadata.width || maxWidth;
      let height = metadata.height || maxHeight;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        if (width > height) {
          width = maxWidth;
          height = Math.round(maxWidth / aspectRatio);
        } else {
          height = maxHeight;
          width = Math.round(maxHeight * aspectRatio);
        }
      }

      // Optimize image
      const pipeline = sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });

      let optimizedBuffer: Buffer;
      if (format === 'webp') {
        optimizedBuffer = await pipeline.webp({ quality }).toBuffer();
      } else if (format === 'jpeg') {
        optimizedBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      } else {
        optimizedBuffer = await pipeline.png({ quality, compressionLevel: 9 }).toBuffer();
      }

      const originalSize = buffer.length;
      const optimizedSize = optimizedBuffer.length;
      const savedBytes = originalSize - optimizedSize;
      const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(2);

      return {
        buffer: optimizedBuffer,
        metadata: {
          originalSize,
          optimizedSize,
          savedBytes,
          savedPercentage: parseFloat(savedPercentage),
          outputPath: '', // Not applicable for buffer
          width,
          height,
        },
      };
    } catch (error) {
      logger.error('Failed to optimize image buffer:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail from image
   */
  static async generateThumbnail(
    inputPath: string,
    thumbnailSize: number = 300,
    outputPath?: string
  ): Promise<string> {
    const finalOutputPath = outputPath || this.getThumbnailPath(inputPath);

    try {
      // Ensure output directory exists
      const outputDir = path.dirname(finalOutputPath);
      await fs.mkdir(outputDir, { recursive: true });

      await sharp(inputPath)
        .resize(thumbnailSize, thumbnailSize, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 })
        .toFile(finalOutputPath);

      return finalOutputPath;
    } catch (error) {
      logger.error(`Failed to generate thumbnail for ${inputPath}:`, error);
      throw error;
    }
  }

  /**
   * Get output path for optimized image
   */
  private static getOutputPath(inputPath: string, format: string): string {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    return path.join(dir, `${name}_optimized.${format}`);
  }

  /**
   * Get thumbnail path
   */
  private static getThumbnailPath(inputPath: string): string {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    return path.join(dir, `${name}_thumb.webp`);
  }

  /**
   * Check if file is an image
   */
  static isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const ext = path.extname(filename).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * Get recommended format based on file type
   */
  static getRecommendedFormat(filename: string): 'jpeg' | 'png' | 'webp' {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.png' || ext === '.gif') {
      return 'png'; // Preserve transparency
    }
    return 'webp'; // Best compression for photos
  }
}

export default ImageOptimizer;

