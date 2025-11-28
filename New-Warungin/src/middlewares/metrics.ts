/**
 * Metrics Middleware
 * Tracks HTTP requests for Prometheus metrics
 */

import { Request, Response, NextFunction } from 'express';
import {
  httpRequestDuration,
  httpRequestTotal,
  errorTotal,
} from '../utils/metrics';

// Check if metrics are available (prom-client installed)
const metricsAvailable = typeof httpRequestDuration.observe === 'function';

/**
 * Middleware to track HTTP request metrics
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Track response finish
  res.on('finish', () => {
    if (!metricsAvailable) return; // Skip if metrics not available
    
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode;

    try {
      // Record request duration
      httpRequestDuration.observe(
        {
          method,
          route,
          status_code: statusCode.toString(),
        },
        duration
      );

      // Increment request counter
      httpRequestTotal.inc({
        method,
        route,
        status_code: statusCode.toString(),
      });

      // Track errors (4xx and 5xx)
      if (statusCode >= 400) {
        errorTotal.inc({
          type: statusCode >= 500 ? 'server_error' : 'client_error',
          route,
        });
      }
    } catch (error) {
      // Silently fail if metrics recording fails
      // Don't break the request flow
    }
  });

  next();
};

