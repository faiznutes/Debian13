import { Response } from 'express';
import logger from './logger';

/**
 * Standardized error handler for API routes
 * Replaces console.error with proper logger for better error tracking
 */
export function handleApiError(res: Response, error: unknown, defaultMessage: string = 'An error occurred') {
  // Type guard untuk error object
  const err = error as Error & { code?: string; statusCode?: number };
  
  logger.error('API Error:', {
    message: err.message,
    code: err.code,
    stack: err.stack,
    name: err.name,
  });

  // Handle database connection errors
  if (err.code === 'P1001' || 
      err.message?.includes('Can\'t reach database server') || 
      err.message?.includes('connection') ||
      err.message?.includes('Database connection error')) {
    return res.status(503).json({ 
      message: 'Database connection error. Please check your database configuration.',
      error: 'DATABASE_CONNECTION_ERROR'
    });
  }

  // Handle Prisma errors
  if (err.code?.startsWith('P')) {
    return res.status(500).json({ 
      message: 'Database error occurred',
      error: err.code || 'DATABASE_ERROR'
    });
  }

  // Handle validation errors (400)
  if (err.message?.includes('required') || 
      err.message?.includes('Tenant ID') ||
      err.message?.includes('Invalid') ||
      err.name === 'ZodError') {
    return res.status(400).json({ 
      message: err.message || 'Invalid request',
      error: err.name || 'VALIDATION_ERROR'
    });
  }

  // Handle not found errors (404)
  if (err.message?.includes('not found') || err.message?.includes('Not Found')) {
    return res.status(404).json({ 
      message: err.message || 'Resource not found',
      error: 'NOT_FOUND'
    });
  }

  // Handle unauthorized errors (401/403)
  if (err.message?.includes('Unauthorized') || err.message?.includes('Access denied')) {
    return res.status(403).json({ 
      message: err.message || 'Access denied',
      error: 'UNAUTHORIZED'
    });
  }

  // Default to 500 for other errors
  res.status(500).json({ 
    message: err.message || defaultMessage,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

