import express, { Express } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import env from './config/env';
import { setupSecurity } from './middlewares/security';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { addCSRFToken } from './middlewares/csrf';
import { metricsMiddleware } from './middlewares/metrics';
import logger from './utils/logger';
import apiRoutes from './routes';
import { initializeSocket } from './socket/socket';
import { swaggerSpec } from './config/swagger';
import prisma from './config/database';
// Initialize scheduler (optional - requires Redis)
import './scheduler';

console.log('📦 Loading Express app...');
const app: Express = express();
const httpServer = createServer(app);
console.log('✅ Express app and HTTP server created');

// Trust proxy - Required when running behind reverse proxy (nginx, cloudflare, etc.)
// This allows Express to correctly identify client IPs and handle X-Forwarded-* headers
// Trust 2 hops: nginx (1) + cloudflare (1) = 2
// This is more secure than 'true' and prevents rate limiter warnings
app.set('trust proxy', 2);

// Security middleware
console.log('🔒 Setting up security middleware...');
setupSecurity(app);
console.log('✅ Security middleware configured');

// CORS - Configure before other middleware
// Security: Only allow configured origins, restrict in production
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
      
      // Allow requests with no origin (like health checks, mobile apps, curl requests)
      // Health checks from Docker don't send Origin header
      if (!origin) {
        // Always allow health check endpoint without origin
        // This is safe because health check doesn't expose sensitive data
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        // In development, log warning but allow (for easier testing)
        // In production, strictly reject
        if (env.NODE_ENV === 'production') {
          logger.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
          callback(new Error('CORS: Not allowed by CORS policy'), false);
        } else {
          logger.warn(`CORS: Allowing unauthorized origin in development: ${origin}`);
          callback(null, true);
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
  })
);

// Compression
app.use(compression());

// Cookie parser (for CSRF token storage)
app.use(cookieParser());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CSRF Protection - Add token to responses (before routes)
// Note: CSRF protection is optional for JWT-based auth, but adds extra security layer
app.use('/api', addCSRFToken);

// Rate limiting
console.log('⏱️  Setting up rate limiting...');
app.use('/api', apiLimiter);
console.log('✅ Rate limiting configured');

// Metrics middleware (before routes to track all requests)
app.use(metricsMiddleware);

// Health check - Enhanced with detailed metrics
app.get('/health', async (req, res) => {
  const health: {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    services: {
      database: string;
      redis: string;
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'degraded';
  }

  // Check Redis connection
  try {
    const { getRedisClient } = await import('./config/redis');
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      health.services.redis = 'connected';
    } else {
      health.services.redis = 'not_configured';
    }
  } catch (error) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API info
app.get('/api', (req, res) => {
  res.json({
    message: 'Warungin API',
    version: '1.1.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      docs: '/api-docs',
    },
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
console.log('🛣️  Setting up API routes...');
app.use('/api', apiRoutes);
console.log('✅ API routes configured');

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

const PORT = env.PORT;

// Initialize Socket.IO
console.log('🔌 Initializing Socket.IO...');
try {
  initializeSocket(httpServer);
  console.log('✅ Socket.IO initialized successfully');
} catch (error) {
  console.error('❌ Socket.IO initialization failed:', error);
  // Continue anyway - Socket.IO is optional
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

console.log(`🚀 Starting HTTP server on port ${PORT}...`);
httpServer.listen(PORT, () => {
  // Use console.log to ensure message appears in Docker logs
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Backend URL: ${env.BACKEND_URL}`);
  console.log(`🔌 Socket.IO initialized`);
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${env.NODE_ENV}`);
  logger.info(`🌐 Backend URL: ${env.BACKEND_URL}`);
  logger.info(`🔌 Socket.IO initialized`);
});

export default app;

