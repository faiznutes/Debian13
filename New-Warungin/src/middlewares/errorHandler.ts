import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Enhanced error logging with request context
 */
function logErrorWithContext(
  err: Error,
  req: Request,
  context: string = 'UNHANDLED_ERROR'
) {
  const errorDetails = {
    context,
    message: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body && Object.keys(req.body).length > 0 ? '[REDACTED]' : undefined,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      origin: req.headers.origin,
    },
    code: (err as any).code,
    statusCode: (err as any).statusCode,
    meta: (err as any).meta,
  };

  logger.error(`Error [${context}]:`, errorDetails);
}

export const errorHandler = (
  err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    logErrorWithContext(err, req, 'VALIDATION_ERROR');
    
    if (!res.headersSent) {
      res.status(400).json({
        error: 'Validation error',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    return;
  }

  // Custom AppError
  if (err instanceof AppError) {
    logErrorWithContext(err, req, 'APP_ERROR');
    
    if (!res.headersSent) {
      res.status(err.statusCode).json({
        error: err.message,
      });
    }
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logErrorWithContext(err, req, 'PRISMA_ERROR');
    
    if (!res.headersSent) {
      // Handle specific Prisma error codes
      switch (err.code) {
        case 'P1001':
        case 'P1002':
          // Connection errors
          res.status(503).json({
            error: 'Database connection failed',
            message: 'Unable to connect to database. Please try again.',
            code: err.code,
          });
          break;
        case 'P2002':
          // Unique constraint violation
          res.status(409).json({
            error: 'Duplicate entry',
            message: 'A record with this information already exists.',
            code: err.code,
          });
          break;
        case 'P2025':
          // Record not found
          res.status(404).json({
            error: 'Record not found',
            message: 'The requested record could not be found.',
            code: err.code,
          });
          break;
        default:
          // Other Prisma errors
          res.status(500).json({
            error: 'Database error',
            message: process.env.NODE_ENV === 'production'
              ? 'A database error occurred. Please try again.'
              : err.message,
            code: err.code,
          });
      }
    }
    return;
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    logErrorWithContext(err, req, 'PRISMA_VALIDATION_ERROR');
    
    if (!res.headersSent) {
      res.status(400).json({
        error: 'Invalid data',
        message: process.env.NODE_ENV === 'production'
          ? 'The provided data is invalid.'
          : err.message,
      });
    }
    return;
  }

  // Unknown errors - comprehensive logging
  logErrorWithContext(err, req, 'UNKNOWN_ERROR');
  
  // Ensure response hasn't been sent
  if (!res.headersSent) {
    const statusCode = (err as any).statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(statusCode).json({
      error: statusCode === 500 && !isDevelopment
        ? 'Internal server error'
        : err.message || 'An unexpected error occurred',
      message: statusCode === 500 && !isDevelopment
        ? 'An unexpected error occurred. Please try again.'
        : err.message || 'An unexpected error occurred',
      ...(isDevelopment && {
        stack: err.stack,
        name: err.name,
        code: (err as any).code,
      }),
    });
  } else {
    // If headers already sent, log warning
    logger.warn('Error handler called but response already sent:', {
      path: req.path,
      method: req.method,
      error: err.message,
      stack: err.stack,
    });
  }
};

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found:', {
    path: req.path,
    method: req.method,
    query: req.query,
  });
  
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
};
