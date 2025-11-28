// Rate limiter - Re-enabled with proper trust proxy configuration
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Get client IP from request
 * Handles X-Forwarded-For header from nginx/cloudflare
 */
const getClientIp = (req: Request): string => {
  // Trust proxy is set to 2 in app.ts (nginx + cloudflare)
  // Express will automatically parse X-Forwarded-For correctly
  const forwarded = req.headers['x-forwarded-for'];
  
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // We want the first one (original client)
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const firstIp = ips.split(',')[0].trim();
    return firstIp || 'unknown';
  }
  
  // Fallback to socket remote address
  return req.socket?.remoteAddress || req.ip || 'unknown';
};

/**
 * Wrap rate limiter to handle errors gracefully
 */
const wrapRateLimiter = (limiter: ReturnType<typeof rateLimit>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Call the rate limiter
      limiter(req, res, (err?: any) => {
        if (err) {
          // Log error but don't block request in case of configuration issues
          logger.warn('Rate limiter error:', {
            error: err.message,
            code: err.code,
            path: req.path,
            ip: getClientIp(req),
          });
          
          // If it's a trust proxy error, allow the request but log it
          if (err.code === 'ERR_ERL_PERMISSIVE_TRUST_PROXY' || 
              err.code === 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR') {
            logger.warn('Rate limiter trust proxy warning - allowing request:', {
              path: req.path,
              ip: getClientIp(req),
            });
            return next();
          }
          
          // For other errors, allow request but log
          return next();
        }
        next();
      });
    } catch (error: any) {
      // Catch any unexpected errors
      logger.error('Rate limiter unexpected error:', {
        error: error.message,
        path: req.path,
        ip: getClientIp(req),
      });
      // Allow request to continue
      next();
    }
  };
};

/**
 * API Rate Limiter
 * Limits: 500 requests per 15 minutes per IP
 */
const createApiLimiter = () => {
  try {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // 500 requests per window
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
      legacyHeaders: false, // Disable `X-RateLimit-*` headers
      skip: (req: Request) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/health';
      },
      keyGenerator: (req: Request) => {
        return getClientIp(req);
      },
      handler: (req: Request, res: Response) => {
        const resetTime = (req as any).rateLimit?.resetTime;
        const retryAfter = resetTime 
          ? Math.ceil((resetTime - Date.now()) / 1000) 
          : 900;
        
        logger.warn('Rate limit exceeded:', {
          ip: getClientIp(req),
          path: req.path,
          retryAfter,
        });
        
        res.status(429).json({
          error: 'Too many requests',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter,
        });
      },
    });
    
    return wrapRateLimiter(limiter);
  } catch (error: any) {
    logger.error('API rate limiter initialization failed:', error);
    // Return no-op middleware if initialization fails
    return (req: Request, res: Response, next: NextFunction) => next();
  }
};

/**
 * Auth Rate Limiter (stricter)
 * Limits: 20 requests per 15 minutes per IP (production)
 *         50 requests per 15 minutes per IP (development)
 */
const createAuthLimiter = () => {
  try {
    const maxAttempts = process.env.NODE_ENV === 'production' ? 20 : 50;
    
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: maxAttempts,
      message: 'Too many login attempts, please try again later.',
      skipSuccessfulRequests: true, // Don't count successful requests
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        return getClientIp(req);
      },
      handler: (req: Request, res: Response) => {
        const resetTime = (req as any).rateLimit?.resetTime;
        const retryAfter = resetTime 
          ? Math.ceil((resetTime - Date.now()) / 1000) 
          : 900;
        
        logger.warn('Auth rate limit exceeded:', {
          ip: getClientIp(req),
          path: req.path,
          retryAfter,
        });
        
        res.status(429).json({
          error: 'Too many login attempts',
          message: process.env.NODE_ENV === 'development' 
            ? 'Terlalu banyak percobaan login yang gagal. Silakan tunggu beberapa saat atau restart server untuk reset limit.'
            : 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
          retryAfter,
          limit: maxAttempts,
          windowMs: 15 * 60 * 1000,
        });
      },
    });
    
    return wrapRateLimiter(limiter);
  } catch (error: any) {
    logger.error('Auth rate limiter initialization failed:', error);
    // Return no-op middleware if initialization fails
    return (req: Request, res: Response, next: NextFunction) => next();
  }
};

export const apiLimiter = createApiLimiter();
export const authLimiter = createAuthLimiter();

/* 
 * Original implementation - disabled due to validation errors
 * 
 * import rateLimit from 'express-rate-limit';
 * 
 * const wrapRateLimiter = (limiter: any) => {
 *   return async (req: Request, res: Response, next: NextFunction) => {
 *     try {
 *       await new Promise<void>((resolve, reject) => {
 *         limiter(req, res, (err?: any) => {
 *           if (err) {
 *             if (err?.code === 'ERR_ERL_PERMISSIVE_TRUST_PROXY' || err?.code === 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR') {
 *               return resolve();
 *             }
 *             return reject(err);
 *           }
 *           resolve();
 *         });
 *       });
 *       next();
 *     } catch (error: any) {
 *       if (error?.code === 'ERR_ERL_PERMISSIVE_TRUST_PROXY' || error?.code === 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR') {
 *         return next();
 *       }
 *       next(error);
 *     }
 *   };
 * };
 * 
 * const createApiLimiter = () => {
 *   try {
 *     const limiter = rateLimit({
 *       windowMs: 15 * 60 * 1000,
 *       max: 500,
 *       message: 'Too many requests from this IP, please try again later.',
 *       standardHeaders: true,
 *       legacyHeaders: false,
 *       skip: (req: Request) => req.path === '/health',
 *       keyGenerator: (req: Request) => {
 *         const forwarded = req.headers['x-forwarded-for'];
 *         if (forwarded) {
 *           const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
 *           return ips || 'unknown';
 *         }
 *         return (req.socket?.remoteAddress) || 'unknown';
 *       },
 *     });
 *     return wrapRateLimiter(limiter);
 *   } catch (error) {
 *     console.error('Rate limiter initialization failed:', error);
 *     return noOpMiddleware;
 *   }
 * };
 * 
 * const createAuthLimiter = () => {
 *   try {
 *     const limiter = rateLimit({
 *       windowMs: 15 * 60 * 1000,
 *       max: process.env.NODE_ENV === 'development' ? 50 : 20,
 *       message: 'Too many login attempts, please try again later.',
 *       skipSuccessfulRequests: true,
 *       standardHeaders: true,
 *       legacyHeaders: false,
 *       keyGenerator: (req: Request) => {
 *         const forwarded = req.headers['x-forwarded-for'];
 *         if (forwarded) {
 *           const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
 *           return ips || 'unknown';
 *         }
 *         return (req.socket?.remoteAddress) || 'unknown';
 *       },
 *       handler: (req: Request, res: Response) => {
 *         const resetTime = (req as any).rateLimit?.resetTime;
 *         const retryAfter = resetTime 
 *           ? Math.ceil((resetTime - Date.now()) / 1000) 
 *           : 900;
 *         res.status(429).json({
 *           error: 'Too many login attempts, please try again later.',
 *           message: process.env.NODE_ENV === 'development' 
 *             ? 'Terlalu banyak percobaan login yang gagal. Silakan tunggu beberapa saat atau restart server untuk reset limit.'
 *             : 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
 *           retryAfter,
 *           limit: process.env.NODE_ENV === 'development' ? 50 : 20,
 *           windowMs: 15 * 60 * 1000,
 *         });
 *       },
 *     });
 *     return wrapRateLimiter(limiter);
 *   } catch (error) {
 *     console.error('Auth rate limiter initialization failed:', error);
 *     return noOpMiddleware;
 *   }
 * };
 */

