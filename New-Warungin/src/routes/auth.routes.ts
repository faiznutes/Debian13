import { Router } from 'express';
import { login } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';
import { authGuard } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import { logAction } from '../middlewares/audit-logger';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * Helper to log route errors with context
 */
function logRouteError(error: unknown, context: string, req: any) {
  const err = error as Error & { 
    code?: string; 
    statusCode?: number; 
    issues?: Array<{ path: (string | number)[]; message: string }>;
    message?: string;
    name?: string;
    stack?: string;
  };
  
  logger.error(`Auth route error [${context}]:`, {
    message: err.message,
    name: err.name,
    code: err.code,
    statusCode: err.statusCode,
    issues: err.issues,
    stack: err.stack,
    path: req.url || req.path,
    method: req.method,
    userId: (req as AuthRequest).userId,
  });
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: 'Invalid email or password'
 */
// Login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    // Log request for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Login request:', {
        email: req.body?.email,
        hasPassword: !!req.body?.password,
        contentType: req.headers['content-type'],
      });
    }

    const validated = loginSchema.parse(req.body);
    const result = await login(validated);
    
    // Log successful login
    if (result.user) {
      await logAction(
        req as AuthRequest,
        'LOGIN',
        'auth',
        result.user.id,
        { email: validated.email },
        'SUCCESS'
      );
    }
    
    res.json(result);
  } catch (error: unknown) {
    const err = error as Error & { 
      code?: string; 
      statusCode?: number; 
      issues?: Array<{ path: (string | number)[]; message: string }>;
      message?: string;
      name?: string;
    };
    
    logRouteError(error, 'LOGIN', req);
    
    // Handle Prisma prepared statement errors (pgbouncer issue)
    if (err.message?.includes('prepared statement') || err.code === '42P05') {
      logger.warn('Prisma prepared statement error detected - this is a pgbouncer issue');
      res.status(503).json({
        error: 'Database connection issue. Please try again in a moment.',
        message: 'The database connection pool is busy. Please retry the request.',
      });
      return;
    }
    
    // Handle database connection errors
    if (err.code === 'P1001' || err.code === 'P1002' || err.message?.includes('connect ECONNREFUSED')) {
      logger.error('Database connection error:', err.message);
      res.status(503).json({
        error: 'Database connection failed. Please try again in a moment.',
        message: 'Unable to connect to database. Please retry the request.',
      });
      return;
    }
    
    // Handle Prisma query errors
    if (err.code?.startsWith('P')) {
      logger.error('Prisma error:', { code: err.code, message: err.message });
      res.status(500).json({
        error: 'Database error occurred. Please try again.',
        message: 'An error occurred while processing your request.',
      });
      return;
    }
    
    // Handle Zod validation errors
    if (err.name === 'ZodError' && err.issues) {
      res.status(400).json({
        error: 'Validation failed',
        details: err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    
    // Handle AppError (from auth service)
    if (err.statusCode) {
      res.status(err.statusCode).json({
        error: err.message,
        message: err.message,
      });
      return;
    }
    
    // Handle any other errors - ensure response is sent
    logger.error('Unhandled login error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.',
    });
  }
});

// Get current user
router.get('/me', authGuard, async (req: AuthRequest, res, next) => {
  try {
    // Validate userId exists
    if (!req.userId) {
      logRouteError(new Error('User ID not found in request'), 'ME_USER_ID_MISSING', req);
      res.status(401).json({ 
        error: 'Unauthorized: User ID not found',
        message: 'Authentication required. Please login again.',
      });
      return;
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          isActive: true,
          permissions: true,
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
        },
      });
    } catch (dbError: unknown) {
      const err = dbError as Error & { code?: string; message?: string };
      logRouteError(dbError, 'ME_DATABASE_QUERY', req);
      
      // Handle database connection errors
      if (err.code === 'P1001' || err.code === 'P1002' || err.message?.includes('connect')) {
        res.status(503).json({ 
          error: 'Database connection failed',
          message: 'Unable to connect to database. Please try again.',
        });
        return;
      }
      
      // Handle Prisma query errors
      if (err.code?.startsWith('P')) {
        res.status(500).json({
          error: 'Database error occurred',
          message: 'An error occurred while fetching user data.',
        });
        return;
      }
      
      // Re-throw other errors to be handled by outer catch
      throw dbError;
    }

    if (!user) {
      logRouteError(new Error('User not found in database'), 'ME_USER_NOT_FOUND', req);
      res.status(404).json({ 
        error: 'User not found',
        message: 'User account not found. Please contact support.',
      });
      return;
    }

    // Format response to match frontend expectations
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId || null,
        tenantName: user.tenant?.name || null,
        isActive: user.isActive,
        permissions: user.permissions || null,
      },
    });
  } catch (error: unknown) {
    const err = error as Error & { code?: string; message?: string };
    logRouteError(error, 'ME_UNEXPECTED_ERROR', req);
    
    // Ensure response hasn't been sent
    if (!res.headersSent) {
      // Pass error to Express error handler
      next(error);
    } else {
      logger.warn('Error in /auth/me but response already sent:', {
        error: err.message,
        path: req.url,
      });
    }
  }
});

export default router;
