/**
 * CSRF Protection Middleware
 * Protects state-changing operations (POST, PUT, DELETE, PATCH) from CSRF attacks
 */

import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';
import logger from '../utils/logger';

const tokens = new Tokens();

/**
 * Generate CSRF token
 * Should be called on GET requests to provide token to frontend
 */
export const generateCSRFToken = (req: Request, res: Response): string => {
  // Get or create secret from session
  let secret = (req.session as any)?.csrfSecret;
  
  if (!secret) {
    secret = tokens.secretSync();
    if (req.session) {
      (req.session as any).csrfSecret = secret;
    } else {
      // If no session, store in a cookie (less secure but works without session)
      res.cookie('csrfSecret', secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }
  }
  
  return tokens.create(secret);
};

/**
 * CSRF Protection Middleware
 * Validates CSRF token for state-changing operations
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for health check and public endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  // Skip CSRF for internal API (uses API key instead)
  if (req.path.startsWith('/api/internal/')) {
    return next();
  }
  
  // Get token from header or body
  const token = req.headers['x-csrf-token'] || req.body?._csrf || req.query?._csrf;
  
  if (!token || typeof token !== 'string') {
    logger.warn('CSRF: Missing token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF token is required for this operation',
    });
    return;
  }
  
  // Get secret from session or cookie
  let secret = (req.session as any)?.csrfSecret;
  if (!secret) {
    secret = req.cookies?.csrfSecret;
  }
  
  if (!secret) {
    logger.warn('CSRF: Missing secret', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(403).json({
      error: 'CSRF validation failed',
      message: 'CSRF secret not found. Please refresh the page.',
    });
    return;
  }
  
  // Verify token
  if (!tokens.verify(secret, token)) {
    logger.warn('CSRF: Invalid token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(403).json({
      error: 'CSRF token invalid',
      message: 'CSRF token validation failed. Please refresh the page and try again.',
    });
    return;
  }
  
  next();
};

/**
 * Add CSRF token to response
 * Middleware to inject CSRF token into responses
 */
export const addCSRFToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate token and add to response
  const token = generateCSRFToken(req, res);
  
  // Add to response header for frontend to read
  res.setHeader('X-CSRF-Token', token);
  
  // Also add to response body if JSON
  if (res.locals) {
    res.locals.csrfToken = token;
  }
  
  next();
};

