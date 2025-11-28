import helmet from 'helmet';
import { Express } from 'express';
import env from '../config/env';

export const setupSecurity = (app: Express): void => {
  // Enhanced security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Needed for inline scripts in HTML
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com',
            'https://s3.amazonaws.com', // IronSource SDK
          ],
          scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          connectSrc: [
            "'self'",
            'https://www.google-analytics.com',
            'https://www.googletagmanager.com',
            'wss:', // WebSocket connections
            'ws:', // WebSocket connections (non-secure)
          ],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null, // Only in production
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      permittedCrossDomainPolicies: false,
    })
  );

  // Additional security headers
  app.use((req, res, next) => {
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-Frame-Options (redundant with helmet, but explicit)
    res.setHeader('X-Frame-Options', 'DENY');
    
    // X-XSS-Protection (legacy, but still useful)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Permissions Policy (formerly Feature Policy)
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );
    
    // Remove X-Powered-By (already done by helmet, but explicit)
    res.removeHeader('X-Powered-By');
    
    next();
  });
};

