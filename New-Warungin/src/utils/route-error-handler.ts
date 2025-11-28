/**
 * Standardized Route Error Handler
 * Provides consistent error handling for all routes to prevent 502/503 errors
 */

import { Response } from 'express';
import logger from './logger';
import { Prisma } from '@prisma/client';

interface ErrorWithCode extends Error {
  code?: string;
  statusCode?: number;
  meta?: any;
}

/**
 * Handle route errors with proper status codes
 * Prevents 502/503 errors by ensuring proper error responses
 */
export function handleRouteError(
  res: Response,
  error: unknown,
  defaultMessage: string = 'An error occurred',
  context?: string
): void {
  // Type guard untuk error object
  const err = error as ErrorWithCode;

  // Log error dengan context
  if (context) {
    logger.error(`Route error [${context}]:`, {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
      name: err.name,
    });
  } else {
    logger.error('Route error:', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
      name: err.name,
    });
  }

  // Check if response already sent
  if (res.headersSent) {
    logger.warn('Response already sent, cannot send error response');
    return;
  }

  // Handle Prisma database connection errors (503 Service Unavailable)
  if (err.code === 'P1001' || err.code === 'P1002' || 
      err.message?.includes('Can\'t reach database server') ||
      err.message?.includes('connection') ||
      err.message?.includes('Database connection error') ||
      err.message?.includes('connect ECONNREFUSED')) {
    res.status(503).json({
      error: 'DATABASE_CONNECTION_ERROR',
      message: 'Database connection failed. Please try again later.',
      code: err.code,
    });
    return;
  }

  // Handle Prisma errors
  if (err.code?.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        res.status(409).json({
          error: 'DUPLICATE_ENTRY',
          message: 'A record with this information already exists.',
          code: err.code,
        });
        return;
      case 'P2025':
        // Record not found
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'The requested record could not be found.',
          code: err.code,
        });
        return;
      case 'P2003':
        // Foreign key constraint failed
        res.status(400).json({
          error: 'FOREIGN_KEY_CONSTRAINT',
          message: 'Invalid reference to related record.',
          code: err.code,
        });
        return;
      default:
        // Other Prisma errors
        res.status(500).json({
          error: 'DATABASE_ERROR',
          message: process.env.NODE_ENV === 'production'
            ? 'A database error occurred. Please try again.'
            : err.message,
          code: err.code,
        });
        return;
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'The provided data is invalid.'
        : err.message,
    });
    return;
  }

  // Handle validation errors (400 Bad Request)
  if (err.message?.includes('required') ||
      err.message?.includes('Tenant ID') ||
      err.message?.includes('Invalid') ||
      err.name === 'ZodError') {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: err.message || 'Invalid request',
    });
    return;
  }

  // Handle not found errors (404 Not Found)
  if (err.message?.includes('not found') ||
      err.message?.includes('Not Found') ||
      err.message?.includes('does not exist')) {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: err.message || 'Resource not found',
    });
    return;
  }

  // Handle unauthorized/forbidden errors (401/403)
  if (err.message?.includes('Unauthorized') ||
      err.message?.includes('Access denied') ||
      err.message?.includes('Forbidden') ||
      err.statusCode === 401 ||
      err.statusCode === 403) {
    const statusCode = err.statusCode || 403;
    res.status(statusCode).json({
      error: statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
      message: err.message || 'Access denied',
    });
    return;
  }

  // Handle custom status codes
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 600) {
    res.status(err.statusCode).json({
      error: err.name || 'ERROR',
      message: err.message || defaultMessage,
    });
    return;
  }

  // Default to 500 for unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: isDevelopment
      ? err.message || defaultMessage
      : 'An unexpected error occurred. Please try again.',
    ...(isDevelopment && {
      stack: err.stack,
      name: err.name,
      code: err.code,
    }),
  });
}

/**
 * Async route handler wrapper
 * Automatically catches errors and handles them properly
 */
export function asyncHandler(
  fn: (req: any, res: Response, next?: any) => Promise<any>
) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleRouteError(res, error, 'An error occurred', `${req.method} ${req.path}`);
    });
  };
}

